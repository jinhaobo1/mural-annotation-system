# -*- coding: utf-8 -*-
# Owner: 于金果（A甲·标注引擎）
"""标注引擎测试：验证真实规则引擎输出与《教程》关键案例一致（区别于前端 JS 模拟数据）。"""
import unittest

from backend import seed_data
from backend.annotator import run_annotation


def _facts(entity, kind="actions"):
    return {(f["name"], f["value"], f["certainty"]) for f in entity[kind]}


class TestPersonMural(unittest.TestCase):
    """人物图 MURAL-02315：双人物 + 属性 + 不确定性 + left_of。"""

    @classmethod
    def setUpClass(cls):
        _, cls.candidate, cls.risk = run_annotation(
            seed_data.ASSIGNABLE_MURALS[0], seed_data.AI_CANDIDATE_V3)

    def test_version_continuity(self):
        """前版 v3 -> 本次生成 v4（真实递增，不是写死的 v4）。"""
        self.assertEqual(self.candidate["versions"]["candidate"], "v4")

    def test_two_entities_and_left_of(self):
        ids = [e["id"] for e in self.candidate["entities"]]
        self.assertEqual(ids, ["E1", "E2"])
        rels = [(r["subject"], r["predicate"], r["object"]) for r in self.candidate["relations"]]
        self.assertIn(("E1", "left_of", "E2"), rels)

    def test_e1_facts(self):
        e1 = self.candidate["entities"][0]
        attrs = {(a["name"], a["value"]) for a in e1["attributes"]}
        self.assertIn(("gender", "男"), attrs)
        self.assertIn(("headwear", "尖山小冠"), attrs)
        acts = _facts(e1)
        self.assertIn(("gesture", "拱手", "certain"), acts)
        # “似施礼” -> probable（教程原则三：不确定性保留）
        self.assertIn(("social_action", "施礼", "probable"), acts)

    def test_e2_facts(self):
        e2 = self.candidate["entities"][1]
        attrs = {(a["name"], a["value"]) for a in e2["attributes"]}
        self.assertIn(("gender", "女"), attrs)
        self.assertIn(("hairstyle", "倭堕髻"), attrs)
        self.assertIn(("lower_garment", "曳地长裙"), attrs)
        self.assertIn(("body_feature", "腹部隆起"), attrs)
        self.assertIn(("gesture", "指点", "certain"), _facts(e2))

    def test_gender_not_duplicated(self):
        e1 = self.candidate["entities"][0]
        genders = [a for a in e1["attributes"] if a["name"] == "gender"]
        self.assertEqual(len(genders), 1)

    def test_bbox_layout_estimated(self):
        for e in self.candidate["entities"]:
            self.assertEqual(e["bbox_source"], "layout_estimated")
            x1, y1, x2, y2 = e["bbox"]
            self.assertGreater(x2, x1)
            self.assertGreater(y2, y1)

    def test_risk_reflects_probable(self):
        """probable 事实应抬高风险评分。"""
        self.assertGreater(self.risk, 20)

    def test_qc_honesty(self):
        codes = {q["code"] for q in self.candidate["qc_issues"]}
        self.assertIn("CAPTION_ONLY", codes)  # 能力边界如实报告
        self.assertIn("CERTAINTY_LOW", codes)


class TestDanceMural(unittest.TestCase):
    """乐舞图 MURAL-02314：群组 / 子组 / 事件 / 关系（对照教程 7.1）。"""

    @classmethod
    def setUpClass(cls):
        _, cls.candidate, _ = run_annotation(seed_data.ASSIGNABLE_MURALS[1])

    def test_groups(self):
        g = {x["id"]: x for x in self.candidate["groups"]}
        self.assertEqual(len(g), 3)
        self.assertEqual((g["G1"]["type"], g["G1"]["count"], g["G1"]["layout"]),
                         ("观众组", 4, "上排"))
        self.assertEqual((g["G2"]["type"], g["G2"]["count"], g["G2"]["layout"]),
                         ("舞者组", 4, "下排"))
        self.assertEqual(g["G3"]["subgroup_of"], "G2")  # 右侧三女 -> 下排舞者组
        self.assertEqual(g["G3"]["count"], 3)
        # 共享事实
        self.assertIn(("posture", "盘腿而坐", "certain"),
                      {(s["name"], s["value"], s["certainty"]) for s in g["G1"]["shared_states"]})
        self.assertIn(("social_action", "观赏", "certain"),
                      {(s["name"], s["value"], s["certainty"]) for s in g["G1"]["shared_actions"]})
        self.assertIn(("performance_action", "细步曼舞", "certain"),
                      {(s["name"], s["value"], s["certainty"]) for s in g["G3"]["shared_actions"]})

    def test_event_performer_observer(self):
        ev = {x["id"]: x for x in self.candidate["events"]}
        self.assertIn("EV1", ev)
        roles = {p["node"]: p["role"] for p in ev["EV1"]["participants"]}
        self.assertEqual(roles.get("G2"), "performer")  # 下排舞者 -> 表演者
        self.assertEqual(roles.get("G1"), "observer")   # 上排观众 -> 观看者

    def test_relations(self):
        rels = {(r["subject"], r["predicate"], r["object"])
                for r in self.candidate["relations"]}
        self.assertIn(("G1", "above", "G2"), rels)
        self.assertIn(("G3", "subgroup_of", "G2"), rels)
        self.assertIn(("E1", "member_of", "G2"), rels)  # 左侧一女子 -> 下排成员
        self.assertIn(("O2", "contains", "O3"), rels)   # 盘 -> 耳杯

    def test_objects(self):
        subs = [e.get("sub_category") for e in self.candidate["entities"]]
        self.assertIn("盘", subs)
        self.assertIn("耳杯", subs)


class TestOtherMurals(unittest.TestCase):
    def test_gatekeeper_probable_official(self):
        """门吏图：似为文职幕僚 -> CIVIL_OFFICIAL probable。"""
        _, c, _ = run_annotation(seed_data.ASSIGNABLE_MURALS[5])
        e = c["entities"][0]
        self.assertEqual(e["fine_category"]["taxonomy_id"], "CIVIL_OFFICIAL")
        self.assertEqual(e["fine_category"]["certainty"], "probable")

    def test_vermilion_bird(self):
        _, c, _ = run_annotation(seed_data.ASSIGNABLE_MURALS[6])
        self.assertEqual(c["entities"][0]["level3_category"], "VERMILION_BIRD")

    def test_tutorial_72_hold_serve(self):
        """教程 7.2：墓主人/侍女/木椅/羽扇 + hold/serve + 立侍→站立。"""
        mural = {"id": "MURAL-T72", "name": "墓主人侍女图",
                 "caption": "墓主人端坐木椅，侍女手持羽扇立侍。", "image": "x.png"}
        _, c, _ = run_annotation(mural)
        levels = {e["level3_category"] for e in c["entities"]}
        self.assertIn("TOMB_OWNER", levels)
        self.assertIn("FEMALE_ATTENDANT", levels)
        self.assertIn("CHAIR", levels)
        rels = {(r["subject"], r["predicate"], r["object"], r["certainty"])
                for r in c["relations"]}
        self.assertIn(("E2", "hold", "羽扇", "certain"), rels)
        self.assertIn(("E2", "serve", "E1", "probable"), rels)
        # 立侍 -> 站立（状态别名）
        e2 = [e for e in c["entities"] if e["level3_category"] == "FEMALE_ATTENDANT"][0]
        self.assertIn(("posture", "站立", "certain"),
                      {(s["name"], s["value"], s["certainty"]) for s in e2["states"]})
        # 羽扇未收录 -> TAXONOMY_GAP（不虚构词条）
        codes = {q["code"] for q in c["qc_issues"]}
        self.assertIn("TAXONOMY_GAP", codes)

    def test_empty_caption_no_crash(self):
        _, c, risk = run_annotation({"id": "MURAL-X", "name": "空",
                                      "caption": "无信息。", "image": "x.png"})
        self.assertEqual(c["entities"], [])
        self.assertGreater(risk, 50)
        codes = {q["code"] for q in c["qc_issues"]}
        self.assertIn("NO_ENTITY", codes)


if __name__ == "__main__":
    unittest.main()
