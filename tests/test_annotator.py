# -*- coding: utf-8 -*-
# Owner: 于金果（A甲·标注引擎）
"""标注引擎（S0–S7）单元测试。

覆盖教程案例：人物图、乐舞图（群组/子组/事件/关系）、门吏图、教程 7.2（hold/serve）。
TODO: 填实 setUpClass 的示例数据与每个 test_* 的断言。
"""
import unittest

from backend.annotator import run_annotation


def _facts(entity, kind="actions"):
    """TODO: 从实体中提取 kind 类型的事实列表（测试辅助）。"""
    pass


class TestPersonMural(unittest.TestCase):
    """人物图案例：属性、推测身份（probable）、left_of 关系。"""

    @classmethod
    def setUpClass(cls):
        # TODO: 构造示例人物图 caption，跑 run_annotation，缓存结果
        pass

    def test_version_continuity(self):
        # TODO: 断言版本递增（种子 v3 → 首次 v4 → 再次 v5）
        pass

    def test_two_entities_and_left_of(self):
        # TODO: 断言识别出两个实体及 left_of 关系
        pass

    def test_e1_facts(self):
        # TODO: 断言实体 1 的属性/动作事实
        pass

    def test_e2_facts(self):
        # TODO: 断言实体 2 的属性/动作事实
        pass

    def test_gender_not_duplicated(self):
        # TODO: 断言性别属性不重复
        pass

    def test_bbox_layout_estimated(self):
        # TODO: 断言 bbox_source == layout_estimated
        pass

    def test_risk_reflects_probable(self):
        # TODO: 断言 probable 数量上升 → 风险评分上升
        pass

    def test_qc_honesty(self):
        # TODO: 断言能力边界报告（CAPTION_ONLY）如实呈现
        pass


class TestDanceMural(unittest.TestCase):
    """乐舞图案例：群组/子组、事件（表演者/观察者）、关系、器物。"""

    @classmethod
    def setUpClass(cls):
        # TODO: 构造教程 7.1 乐舞图示例
        pass

    def test_groups(self):
        # TODO: 断言群组与子组识别
        pass

    def test_event_performer_observer(self):
        # TODO: 断言事件中表演者/观察者角色
        pass

    def test_relations(self):
        # TODO: 断言关系抽取结果
        pass

    def test_objects(self):
        # TODO: 断言器物实体识别
        pass


class TestOtherMurals(unittest.TestCase):
    """其他案例：门吏图、四神图、教程 7.2、空 caption 边界。"""

    def test_gatekeeper_probable_official(self):
        # TODO: 断言「似为文职幕僚」→ CIVIL_OFFICIAL probable
        pass

    def test_vermilion_bird(self):
        # TODO: 断言四神·朱雀识别
        pass

    def test_tutorial_72_hold_serve(self):
        # TODO: 断言教程 7.2（墓主人/侍女/木椅/羽扇，hold/serve）
        pass

    def test_empty_caption_no_crash(self):
        # TODO: 断言空 caption 不崩溃
        pass


if __name__ == "__main__":
    unittest.main()
