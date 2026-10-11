# -*- coding: utf-8 -*-
# Owner: 韩雨杰（B甲·后端）
"""API 全链路测试（FastAPI TestClient）。

覆盖：health / bootstrap / state 白名单与往返 / samples / ai run 版本递增 /
export json+jsonl / 前端静态托管。
TODO: 填实 setUpClass 与每个 test_* 的断言。
"""
import unittest


def make_client():
    """TODO: 返回 FastAPI TestClient 实例。"""
    pass


class TestAPI(unittest.TestCase):
    """API 全链路。"""

    @classmethod
    def setUpClass(cls):
        # TODO: 建测试客户端 + 临时数据库（测试后清理）
        pass

    @classmethod
    def tearDownClass(cls):
        # TODO: 清理临时数据库
        pass

    def test_health(self):
        # TODO: 断言 GET /api/health 返回 ok
        pass

    def test_bootstrap_seeds_all_keys(self):
        # TODO: 断言 bootstrap 返回全部白名单键
        pass

    def test_state_roundtrip(self):
        # TODO: 断言 state 写入后可读回
        pass

    def test_state_whitelist_rejects_unknown_key(self):
        # TODO: 断言写入白名单外键返回 400
        pass

    def test_samples(self):
        # TODO: 断言 GET /api/samples 返回列表
        pass

    def test_ai_run_real_result(self):
        # TODO: 断言 ai run 返回真实候选 + 版本递增
        pass

    def test_ai_run_unknown_mural(self):
        # TODO: 断言未知 mural_id 返回 404
        pass

    def test_export_json(self):
        # TODO: 断言 export json 结构合法
        pass

    def test_export_jsonl(self):
        # TODO: 断言 export jsonl 每行一条记录
        pass

    def test_frontend_index_served(self):
        # TODO: 断言静态托管可访问 index.html
        pass


if __name__ == "__main__":
    unittest.main()
