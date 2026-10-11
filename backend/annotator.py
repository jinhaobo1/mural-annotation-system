# -*- coding: utf-8 -*-
# Owner: 于金果（A甲·标注引擎）
"""真实 AI 自动标注引擎：按《壁画结构化语义标注教程》的 S0–S7 八遍流程实现。

这是一个 caption 驱动的规则引擎（不依赖外部大模型服务）：
- S0 预处理：caption 规范化、分句、指纹
- S1 Caption解析：人物/群组/器物/方位词条识别
- S2 Grounding：按版面描述估计 bbox（layout_estimated，诚实标注）
- S3 遗漏发现：caption-only 流程的能力边界报告
- S4 属性/状态/动作：按标注体系 fact schema 逐条抽取
- S5 Group/Event：群组、事件与 performer/observer 角色
- S6 Relation：left_of/above/member_of/subgroup_of/hold/serve 等关系
- S7 QC风险：确定度检查 + 风险评分

原则（与教程一致）：证据优先、原始语义保留、不确定性保留（"似"→probable）、
视觉事实与解释分离。
"""
import hashlib
import re

CANVAS_W, CANVAS_H = 1000, 800

# ---------------- 标注体系词汇（与前端 taxonomy v1.2-custom 一致） ----------------
HUMAN_ATTRIBUTES = [
    ("gender", "性别", ["男", "女"]),
    ("hairstyle", "发式", ["双髻", "高髻", "束发", "倭堕髻", "披发"]),
    ("headwear", "冠帽", ["尖山小冠", "进贤冠", "介帻", "展脚幞头", "软脚幞头"]),
    ("upper_garment", "上装", ["交领衫", "圆领窄袖袍", "交领袍", "百戏衫"]),
    ("lower_garment", "下装", ["曳地长裙", "长裙", "裤"]),
    ("body_feature", "身体特征", ["腹部隆起", "胡须", "丰腴", "瘦削"]),
]
HUMAN_STATES = [
    ("posture", "姿态", ["站立", "端坐", "盘腿而坐", "跪坐", "席地而坐", "俯身", "匍匐"]),
]
HUMAN_ACTIONS = [
    ("gesture", "手势动作", ["拱手", "作揖", "指点", "挥袖", "双手置腹前", "左手置腹前"]),
    ("performance_action", "表演动作", ["长袖起舞", "起舞", "细步曼舞", "舞蹈", "奏乐", "击鼓", "吹奏"]),
    ("social_action", "社交动作", ["施礼", "观赏", "交谈", "侍立"]),
    ("locomotion", "移动动作", ["行走", "奔跑", "骑行"]),
]
# 特殊映射（教程 7.2：侍女"立侍"→ state 站立）
STATE_ALIASES = {"立侍": ("posture", "站立")}

# 单数人物词条：正则 -> (类别, 性别)
SINGULAR_PERSONS = [
    (r"墓主人", "TOMB_OWNER", None),
    (r"夫人", "LADY", "女"),
    (r"侍女", "FEMALE_ATTENDANT", "女"),
    (r"男侍", "MALE_ATTENDANT", "男"),
    (r"侍者", "ATTENDANT_GENERIC", None),
    (r"门吏", "GENERIC_PERSON", None),
    (r"男子", "GENERIC_PERSON", "男"),
    (r"女子", "GENERIC_PERSON", "女"),
    (r"一人", "GENERIC_PERSON", None),
]
# 群组词条："(上排|下排|左侧|右侧)X人/女/男"（X 为中文或阿拉伯数字）
GROUP_RE = re.compile(r"(上排|下排|左侧|右侧|上部|下部)([一二三四五六七八九十百\d]+)(人|女|男)")
# 器物/神异/车马词条：正则 -> (base, l1, l2, l3, 名称)
OBJECT_TERMS = [
    (r"木椅|椅子|坐椅", "FURNITURE", "FURNITURE", "SEATING", "CHAIR", "椅"),
    (r"耳杯", "OBJECT", "OBJECT", "OBJECT_DINING", "EAR_CUP", "耳杯"),
    (r"壶", "OBJECT", "OBJECT", "OBJECT_DINING", "JUG", "壶"),
    (r"盘", "OBJECT", "OBJECT", "OBJECT_DINING", "PLATE", "盘"),
    (r"马车", "VEHICLE", "VEHICLE", "CART", "HORSE_CART", "马车"),
    (r"车马", "VEHICLE", "VEHICLE", "CART", "HORSE_CART", "车马"),
    (r"朱雀", "SUPERNATURAL", "SUPERNATURAL", "FOUR_SYMBOLS", "VERMILION_BIRD", "朱雀"),
]
# 事件关键词 -> 事件类型
EVENT_WORDS = ["舞蹈", "奏乐", "宴饮", "出行", "厨炊"]
# 场景分类：关键词 -> (level1, level1_id, level2, level2_id)
SCENE_RULES = [
    (["舞蹈", "观赏", "起舞", "曼舞"], "乐舞娱乐", "SCENE_PERFORMANCE", "舞蹈", "SCENE_DANCE"),
    (["宴饮", "庖厨", "厨炊"], "宴饮饮食", "SCENE_BANQUET", "宴饮", "SCENE_FEAST"),
    (["仪卫", "仪仗", "出行", "车马"], "出行仪仗", "SCENE_TRAVEL", "仪仗行进", "SCENE_PROCESSION"),
    (["朱雀", "青龙", "白虎", "玄武"], "神话祥瑞", "SCENE_MYTH", "祥瑞", "SCENE_AUSPICIOUS"),
    (["门吏", "施礼", "拱手"], "人物生活", "SCENE_LIFE", "人物互动", "SCENE_INTERACTION"),
]
PROBABLE_MARKERS = re.compile(r"似|约|可能|或为|疑似")
HOLD_RE = re.compile(r"(手持|执|捧|持)(一?[个只枚]?)?([一-龥]{1,4})")

_CN_NUM = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10}


def cn_num(s):
    if s.isdigit():
        return int(s)
    if s == "十":
        return 10
    if len(s) == 2 and s[0] == "十":
        return 10 + _CN_NUM.get(s[1], 0)
    if len(s) == 2 and s[1] == "十":
        return _CN_NUM.get(s[0], 0) * 10
    return sum(_CN_NUM.get(ch, 0) for ch in s)


def _split_clauses(text):
    parts = re.split(r"[。；;，,]", text)
    return [p.strip() for p in parts if p.strip()]


def _layout(clause):
    row = None
    for w in ("上排", "下排", "上部", "下部"):
        if w in clause:
            row = w
            break
    side = None
    for w in ("左侧", "右侧", "门侧"):
        if w in clause:
            side = w
            break
    return row, side


def _certainty(clause):
    return "probable" if PROBABLE_MARKERS.search(clause) else "certain"


def _match_fact(clause):
    """按 fact schema 词汇表逐条抽取属性/状态/动作。"""
    attributes, states, actions = [], [], []
    for code, name, values in HUMAN_ATTRIBUTES:
        for v in values:
            if v in clause:
                attributes.append({"name": code, "value": v,
                                   "certainty": _certainty(clause),
                                   "evidence": "caption_explicit", "ai_confidence": 0.9})
    for code, name, values in HUMAN_STATES:
        for v in values:
            if v in clause:
                states.append({"name": code, "value": v,
                               "certainty": _certainty(clause),
                               "evidence": "caption_explicit", "ai_confidence": 0.9})
    for alias, (code, v) in STATE_ALIASES.items():
        if alias in clause:
            states.append({"name": code, "value": v,
                           "certainty": _certainty(clause),
                           "evidence": "caption_inference", "ai_confidence": 0.8})
    for code, name, values in HUMAN_ACTIONS:
        for v in values:
            if v == "舞蹈" and "观赏" in clause:
                continue  # “观赏舞蹈”中舞蹈是观赏对象，不作为表演动作
            if v in clause:
                actions.append({"name": code, "value": v,
                                 "certainty": _certainty(clause),
                                 "evidence": "caption_explicit", "ai_confidence": 0.85})
    return attributes, states, actions


def _dedupe_facts(facts):
    """同 name 内去掉被更长值包含的短值（长袖起舞/起舞、曳地长裙/长裙），并按 (name,value) 去重保序。"""
    by_name = {}
    for f in facts:
        by_name.setdefault(f["name"], []).append(f["value"])
    keep_vals = {}
    for name, vals in by_name.items():
        uniq = list(dict.fromkeys(vals))
        keep_vals[name] = {v for v in uniq if not any(v != w and v in w for w in uniq)}
    out, seen = [], set()
    for f in facts:
        key = (f["name"], f["value"])
        if f["value"] in keep_vals.get(f["name"], set()) and key not in seen:
            out.append(f)
            seen.add(key)
    return out


def _bbox(row, side, is_group=False):
    """S2 Grounding：按版面描述估计 bbox（诚实标记为 layout_estimated）。"""
    x1, y1, x2, y2 = 40, 40, 960, 760
    if side == "左侧":
        x1, x2 = 40, 460
    elif side == "右侧":
        x1, x2 = 540, 960
    if row in ("上排", "上部"):
        y1, y2 = 40, 380
    elif row in ("下排", "下部"):
        y1, y2 = 420, 760
    if is_group:
        x1, x2 = 40, 960
        if side == "左侧":
            x1, x2 = 40, 460
        elif side == "右侧":
            x1, x2 = 540, 960
    return [x1, y1, x2, y2]


def _scene_of(caption):
    for keywords, l1, l1_id, l2, l2_id in SCENE_RULES:
        if any(k in caption for k in keywords):
            return {"id": "S1", "level1": l1, "level1_id": l1_id,
                    "level2": l2, "level2_id": l2_id,
                    "certainty": "probable", "evidence": "caption_inference",
                    "review_status": "pending"}
    return {"id": "S1", "level1": "人物生活", "level1_id": "SCENE_LIFE",
            "level2": "人物互动", "level2_id": "SCENE_INTERACTION",
            "certainty": "possible", "evidence": "caption_inference",
            "review_status": "pending"}


class AnnotationEngine:
    def __init__(self, mural, prev_candidate=None):
        self.mural = mural
        self.caption = mural.get("caption", "")
        self.name = mural.get("name", "")
        self.mural_id = mural.get("id", mural.get("mural_id", ""))
        self.qc = []
        self.entities, self.groups, self.events, self.relations = [], [], [], []
        self.probable_count = 0
        self.prev_version = 0
        if prev_candidate:
            v = (prev_candidate.get("versions") or {}).get("candidate") or "v0"
            m = re.search(r"\d+", str(v))
            self.prev_version = int(m.group()) if m else 0

    # ---------- S0 ----------
    def s0_preprocess(self):
        self.text = re.sub(r"\s+", "", self.caption)
        self.clauses = _split_clauses(self.text)
        self.fingerprint = hashlib.md5(self.text.encode("utf-8")).hexdigest()[:12]
        return "规范化 %d 字 · 分句 %d · fingerprint %s" % (len(self.text), len(self.clauses), self.fingerprint)

    # ---------- S1 + S4 ----------
    def s1_parse(self):
        self._parse_groups()
        self._parse_persons()
        self._parse_objects()
        return "识别实体 %d · 群组 %d · 分句 %d" % (
            len(self.entities), len(self.groups), len(self.clauses))

    def s4_facts(self):
        n = sum(len(e.get("attributes", [])) + len(e.get("states", [])) + len(e.get("actions", [])) for e in self.entities)
        n += sum(len(g.get("shared_attributes", [])) + len(g.get("shared_states", [])) + len(g.get("shared_actions", [])) for g in self.groups)
        return "实体/群组事实共 %d 条（含属性/状态/动作）" % n

    def _parse_groups(self):
        for i, clause in enumerate(self.clauses):
            m = GROUP_RE.search(clause)
            if not m:
                continue
            layout, count_raw, unit = m.group(1), m.group(2), m.group(3)
            count = cn_num(count_raw)
            if count < 2:
                continue  # 单个人物交给实体抽取
            gid = "G%d" % (len(self.groups) + 1)
            g = {"id": gid, "type": "人物子组" if layout in ("左侧", "右侧") else "人物组",
                 "count": count, "count_type": "exact",
                 "layout": layout, "members": [], "subgroup_of": None,
                 "shared_attributes": [], "shared_states": [], "shared_actions": [],
                 "bbox": _bbox(layout, None, is_group=True),
                 "bbox_source": "layout_estimated",
                 "certainty": "certain", "evidence": "caption_explicit",
                 "review_status": "pending", "ai_confidence": 0.85,
                 "_ci": i}
            if unit == "女":
                g["shared_attributes"].append({"name": "gender", "value": "女",
                                               "certainty": "certain",
                                               "evidence": "caption_explicit",
                                               "ai_confidence": 0.95})
            # 群组事实窗口：本句 + 后续句（遇到新的人物/群组词条即停，先判断再并入）
            window = [clause]
            for c in self.clauses[i + 1:i + 3]:
                if GROUP_RE.search(c) or any(re.search(p, c) for p, *_ in SINGULAR_PERSONS):
                    break
                window.append(c)
            for c in window:
                a, s, act = _match_fact(c)
                g["shared_attributes"] += a
                g["shared_states"] += s
                g["shared_actions"] += act
            g["shared_attributes"] = _dedupe_facts(g["shared_attributes"])
            g["shared_states"] = _dedupe_facts(g["shared_states"])
            g["shared_actions"] = _dedupe_facts(g["shared_actions"])
            if layout not in ("左侧", "右侧"):
                if any("观赏" in str(x.get("value")) for x in g["shared_actions"]):
                    g["type"] = "观众组"
                elif any(x.get("value") in ("舞蹈", "起舞", "长袖起舞", "细步曼舞") for x in g["shared_actions"]):
                    g["type"] = "舞者组"
            self.groups.append(g)

    def _parse_persons(self):
        for i, clause in enumerate(self.clauses):
            for pattern, level3, gender in SINGULAR_PERSONS:
                if not re.search(pattern, clause):
                    continue
                row, side = _layout(clause)
                if row is None:
                    row = self._nearest_row(i)
                eid = "E%d" % (len(self.entities) + 1)
                # 事实窗口：本句起，直到下一个新的人物/群组词条句
                window = [clause]
                for c in self.clauses[i + 1:i + 6]:
                    if GROUP_RE.search(c) or any(re.search(p, c) for p, *_ in SINGULAR_PERSONS):
                        break
                    window.append(c)
                window_text = "".join(window)
                attributes, states, actions = [], [], []
                for c in window:
                    a, s, act = _match_fact(c)
                    attributes += a
                    states += s
                    actions += act
                attributes, states, actions = (_dedupe_facts(x) for x in (attributes, states, actions))
                if gender and not any(f["name"] == "gender" for f in attributes):
                    attributes.insert(0, {"name": "gender", "value": gender,
                                         "certainty": "certain",
                                         "evidence": "caption_explicit",
                                         "ai_confidence": 0.95})
                certainty = _certainty(clause)
                fine = {"value": "普通人物（未细分）", "taxonomy_id": level3,
                        "certainty": certainty, "evidence": ["caption_explicit"],
                        "ai_confidence": 0.9}
                if "文职幕僚" in window_text:
                    fine = {"value": "文吏", "taxonomy_id": "CIVIL_OFFICIAL",
                            "certainty": "probable", "evidence": ["caption_explicit"],
                            "ai_confidence": 0.6}
                e = {"id": eid, "base_category": "HUMAN", "level1_category": "HUMAN",
                     "level2_category": "HUMAN_ORDINARY", "level3_category": level3,
                     "sub_category": "文吏" if fine["taxonomy_id"] == "CIVIL_OFFICIAL" else "普通人物",
                     "fine_category": fine,
                     "bbox": _bbox(row, side), "bbox_source": "layout_estimated",
                     "attributes": attributes, "states": states, "actions": actions,
                     "visibility": "clear", "source_type": "caption_grounded",
                     "layout": {"row": row, "side": side},
                     "certainty": certainty, "evidence": "caption_explicit",
                     "review_status": "pending"}
                self.entities.append(e)
                self._hold_relation(e, window_text)
                self._serve_relation(e)
                break  # 每句至多一个单数人物

    def _nearest_row(self, i):
        """人物句无行位词时，向前找最近的行位词（群组行位作为上下文）。"""
        for j in range(i - 1, -1, -1):
            row, _ = _layout(self.clauses[j])
            if row:
                return row
        return None

    def _hold_relation(self, entity, clause):
        m = HOLD_RE.search(clause)
        if not m:
            return
        obj_name = m.group(3)
        known = None
        for pat, base, l1, l2, l3, label in OBJECT_TERMS:
            if re.search(pat, obj_name):
                known = (base, l1, l2, l3, label)
                break
        if known:
            base, l1, l2, l3, label = known
            oid = "O%d" % (len(self.entities) + 1)
            self.entities.append({
                "id": oid, "base_category": base, "level1_category": l1,
                "level2_category": l2, "level3_category": l3,
                "sub_category": label, "bbox": entity["bbox"],
                "bbox_source": "layout_estimated", "attributes": [], "states": [],
                "actions": [], "visibility": "clear",
                "source_type": "caption_grounded", "certainty": "certain",
                "evidence": "caption_explicit", "review_status": "pending"})
            target = oid
        else:
            obj_name = m.group(3)
            # 去掉尾随的动作/状态词（如“羽扇立侍”中的“立侍”）
            for alias in STATE_ALIASES:
                obj_name = obj_name.replace(alias, "")
            for code, name, values in HUMAN_STATES + HUMAN_ACTIONS:
                for v in values:
                    if obj_name.endswith(v):
                        obj_name = obj_name[:-len(v)]
            obj_name = obj_name.strip() or m.group(3)
            # 未收录器物：不虚构 taxonomy 词条，登记 qc 缺口（S3 遗漏发现）
            target = obj_name
            self.qc.append({"code": "TAXONOMY_GAP", "severity": "warning",
                            "message": "器物「%s」未收录进当前 taxonomy，hold 关系保留原始语义，建议扩充词条" % obj_name,
                            "node": entity["id"]})
        self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                               "family": "INTERACTION", "predicate": "hold",
                               "subject": entity["id"], "object": target,
                               "certainty": "certain", "evidence": "caption_explicit",
                               "ai_confidence": 0.9, "review_status": "pending"})

    def _serve_relation(self, entity):
        """侍从类与主人共现时生成 serve 关系（NARRATIVE，probable，caption_inference）。"""
        if entity["level3_category"] not in ("FEMALE_ATTENDANT", "MALE_ATTENDANT", "ATTENDANT_GENERIC"):
            return
        for other in self.entities:
            if other is entity:
                continue
            if other["level3_category"] in ("TOMB_OWNER", "LADY"):
                self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                       "family": "NARRATIVE", "predicate": "serve",
                                       "subject": entity["id"], "object": other["id"],
                                       "certainty": "probable", "evidence": "caption_inference",
                                       "ai_confidence": 0.7, "review_status": "pending"})

    def _parse_objects(self):
        for clause in self.clauses:
            for pat, base, l1, l2, l3, label in OBJECT_TERMS:
                if not re.search(pat, clause):
                    continue
                if any(re.search(pat, e.get("sub_category", "")) for e in self.entities):
                    continue  # 已作为 hold 对象登记
                row, side = _layout(clause)
                oid = "O%d" % (len(self.entities) + 1)
                self.entities.append({
                    "id": oid, "base_category": base, "level1_category": l1,
                    "level2_category": l2, "level3_category": l3,
                    "sub_category": label, "bbox": _bbox(row, side),
                    "bbox_source": "layout_estimated", "attributes": [], "states": [],
                    "actions": [], "visibility": "clear",
                    "source_type": "caption_grounded", "certainty": _certainty(clause),
                    "evidence": "caption_explicit", "review_status": "pending"})

    # ---------- S2 / S3 ----------
    def s2_grounding(self):
        n = len(self.entities) + len(self.groups)
        estimated = sum(1 for x in self.entities + self.groups if x.get("bbox_source") == "layout_estimated")
        return "为 %d 个节点分配 bbox（%d 个为版面估计，需人工校正）" % (n, estimated)

    def s3_omission(self):
        self.qc.append({"code": "CAPTION_ONLY", "severity": "info",
                        "message": "本次运行为 caption-only 流程，未读取图像；视觉细节以 caption 为准，建议结合图像人工复核",
                        "node": None})
        if self.groups:
            self.qc.append({"code": "MEMBERS_UNRESOLVED", "severity": "warning",
                            "message": "群组成员未逐一绑定实体 bbox，请在审核页完成成员对齐",
                            "node": self.groups[0]["id"]})
        return "能力边界报告 %d 条" % len(self.qc)

    # ---------- S5 ----------
    def s5_group_event(self):
        for word in EVENT_WORDS:
            if word not in self.caption:
                continue
            performer, observer = None, None

            def _is_performer(node):
                if node.get("base_category") == "HUMAN":
                    return any(word in str(a.get("value", "")) for a in node.get("actions", []))
                vals = [x.get("value") for x in node.get("shared_actions", [])] + \
                       [x.get("value") for x in node.get("shared_states", [])]
                return any(word in str(v) or (word == "舞蹈" and str(v) in ("舞蹈", "起舞", "长袖起舞", "细步曼舞")) for v in vals)

            # performer 优先行位群组（上排/下排），其次侧位子组，最后单数实体
            for g in self.groups:
                if g["layout"] in ("上排", "下排", "上部", "下部") and _is_performer(g):
                    performer = g["id"]
                    break
            if performer is None:
                for g in self.groups:
                    if _is_performer(g):
                        performer = g["id"]
                        break
            if performer is None:
                for e in self.entities:
                    if _is_performer(e):
                        performer = e["id"]
                        break
            for g in self.groups:
                if any("观赏" in str(x.get("value")) for x in g.get("shared_actions", [])):
                    observer = g["id"]
                    break
            participants = []
            if performer:
                participants.append({"node": performer, "role": "performer"})
            if observer and observer != performer:
                participants.append({"node": observer, "role": "observer"})
            if not participants:
                continue
            self.events.append({"id": "EV%d" % (len(self.events) + 1),
                                "family": "PERFORMANCE" if word == "舞蹈" else "ACTIVITY",
                                "type": word, "region": None,
                                "participants": participants, "certainty": "certain",
                                "evidence": "caption_explicit", "review_status": "pending"})
        # 事件角色的 group-event 参与者匹配后补
        return "识别事件 %d 个（performer/observer 已绑定）" % len(self.events)

    # ---------- S6 ----------
    def s6_relations(self):
        # 1) 左右单数人物 -> left_of
        humans = [e for e in self.entities if e["base_category"] == "HUMAN"]
        lefts = [e for e in humans if e["layout"]["side"] == "左侧"]
        rights = [e for e in humans if e["layout"]["side"] == "右侧"]
        if len(lefts) == 1 and len(rights) == 1:
            self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                   "family": "SPATIAL", "predicate": "left_of",
                                   "subject": lefts[0]["id"], "object": rights[0]["id"],
                                   "certainty": "certain", "evidence": "caption_explicit",
                                   "ai_confidence": 0.95, "review_status": "pending"})
        # 2) 行位群组 -> above / below
        rows = [g for g in self.groups if g["layout"] in ("上排", "上部")]
        lows = [g for g in self.groups if g["layout"] in ("下排", "下部")]
        for up in rows:
            for low in lows:
                self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                       "family": "SPATIAL", "predicate": "above",
                                       "subject": up["id"], "object": low["id"],
                                       "certainty": "certain", "evidence": "caption_explicit",
                                       "ai_confidence": 0.93, "review_status": "pending"})
        # 3) 侧位小群组 -> subgroup_of 解析顺序中最近的前置行位群组；单数人物 -> member_of 行位群组
        for g in self.groups:
            if g["layout"] in ("左侧", "右侧"):
                ci = g.get("_ci", 0)
                candidates = [b for b in self.groups
                              if b is not g and b["layout"] in ("上排", "下排", "上部", "下部")
                              and b.get("_ci", 0) < ci]
                if candidates:
                    big = candidates[-1]
                    g["subgroup_of"] = big["id"]
                    self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                           "family": "MEMBERSHIP", "predicate": "subgroup_of",
                                           "subject": g["id"], "object": big["id"],
                                           "certainty": "certain", "evidence": "caption_explicit",
                                           "ai_confidence": 0.92, "review_status": "pending"})
        for e in self.entities:
            row = (e.get("layout") or {}).get("row")
            if e["base_category"] == "HUMAN" and row:
                for g in self.groups:
                    if g["layout"] == row:
                        self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                               "family": "MEMBERSHIP", "predicate": "member_of",
                                               "subject": e["id"], "object": g["id"],
                                               "certainty": "certain", "evidence": "caption_inference",
                                               "ai_confidence": 0.8, "review_status": "pending"})
                        break
        # 4) 盘内置放耳杯 -> contains
        plates = [e for e in self.entities if e["level3_category"] == "PLATE"]
        cups = [e for e in self.entities if e["level3_category"] == "EAR_CUP"]
        if plates and cups and any("置放" in self.caption or "内置" in self.caption for _ in [0]):
            self.relations.append({"id": "R%d" % (len(self.relations) + 1),
                                   "family": "SPATIAL", "predicate": "contains",
                                   "subject": plates[0]["id"], "object": cups[0]["id"],
                                   "certainty": "certain", "evidence": "caption_explicit",
                                   "ai_confidence": 0.88, "review_status": "pending"})
        return "生成关系 %d 条（SPATIAL/MEMBERSHIP/INTERACTION/NARRATIVE/TEXT）" % len(self.relations)

    # ---------- S7 ----------
    def s7_qc(self):
        self.probable_count = sum(
            1 for e in self.entities + self.groups
            for k in ("attributes", "states", "actions", "shared_attributes", "shared_states", "shared_actions")
            for f in e.get(k, []) if f.get("certainty") == "probable")
        for r in self.relations:
            if r.get("certainty") == "probable":
                self.probable_count += 1
        for e in self.entities:
            bbox = e.get("bbox") or []
            if not (isinstance(bbox, list) and len(bbox) == 4 and bbox[2] > bbox[0] and bbox[3] > bbox[1]):
                self.qc.append({"code": "QC_BBOX_INVALID", "severity": "error",
                                "message": "实体 %s 的 bbox 无效" % e["id"], "node": e["id"]})
        if self.probable_count:
            self.qc.append({"code": "CERTAINTY_LOW", "severity": "warning",
                            "message": "%d 条事实为 probable/不确定标注（教程原则三：不确定性保留）" % self.probable_count,
                            "node": None})
        risk = 20 + 8 * self.probable_count + 12 * len([q for q in self.qc if q["severity"] != "info"])
        if not self.entities and not self.groups:
            self.qc.append({"code": "NO_ENTITY", "severity": "error",
                            "message": "未能从 caption 解析出实体，需人工标注", "node": None})
            risk += 30
        return "QC 记录 %d 条 · 风险评分 %d/100" % (len(self.qc), min(risk, 100))

    # ---------- 汇总 ----------
    def run(self):
        stage_defs = [
            ("S0", "预处理", lambda: self.s0_preprocess()),
            ("S1", "Caption解析", lambda: self.s1_parse()),
            ("S2", "Grounding", lambda: self.s2_grounding()),
            ("S3", "遗漏发现", lambda: self.s3_omission()),
            ("S4", "属性状态动作", lambda: self.s4_facts()),
            ("S5", "Group/Event", lambda: self.s5_group_event()),
            ("S6", "Relation", lambda: self.s6_relations()),
            ("S7", "QC风险", lambda: self.s7_qc()),
        ]
        stages = []
        for sid, name, fn in stage_defs:
            stages.append({"stage": sid, "name": name, "status": "done", "detail": fn()})
        for g in self.groups:
            g.pop("_ci", None)

        risk = 20 + 8 * self.probable_count + 12 * len([q for q in self.qc if q["severity"] != "info"])
        if not self.entities and not self.groups:
            risk += 30
        version = "v%d" % (self.prev_version + 1)
        candidate = {
            "mural_id": self.mural_id,
            "name": self.name,
            "image": self.mural.get("image", "assets/sample_mural.png"),
            "caption": self.caption,
            "view_type": "full_scene",
            "source_group_id": "SCENE-" + self.mural_id.split("-")[-1] if "-" in self.mural_id else "SCENE-000",
            "workflow_status": "AI_READY",
            "versions": {"candidate": version, "reviewed": None, "approved": None},
            "scene": {"annotations": [_scene_of(self.caption)]},
            "regions": [],
            "entities": self.entities,
            "groups": self.groups,
            "events": self.events,
            "relations": self.relations,
            "qc_issues": self.qc,
            "ai_meta": {"engine": "rule-based-8pass", "pipeline": "S0-S7",
                        "fingerprint": self.fingerprint, "risk_score": min(risk, 100)},
        }
        return stages, candidate, min(risk, 100)


def run_annotation(mural, prev_candidate=None):
    """对外入口：执行完整 8-pass 标注，返回 (stages, candidate, risk)。"""
    return AnnotationEngine(mural, prev_candidate).run()
