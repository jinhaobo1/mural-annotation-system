# -*- coding: utf-8 -*-
# Owner: 韩雨杰（B甲·后端）
"""API 测试：FastAPI TestClient（每个用例独立临时数据库）。"""
import os
import tempfile
import unittest

from fastapi.testclient import TestClient


def make_client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["MURAL_DB_PATH"] = path
    # 重新加载 main，使其用新的临时库
    import importlib
    import backend.db as db_mod
    importlib.reload(db_mod)
    import backend.main as main_mod
    importlib.reload(main_mod)
    return TestClient(main_mod.app), path


class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client, cls.db_path = make_client()

    @classmethod
    def tearDownClass(cls):
        try:
            os.remove(cls.db_path)
        except OSError:
            pass
        os.environ.pop("MURAL_DB_PATH", None)

    def test_health(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["ok"])

    def test_bootstrap_seeds_all_keys(self):
        r = self.client.get("/api/bootstrap")
        self.assertEqual(r.status_code, 200)
        state = r.json()
        for key in ("sample_meta", "review_draft_v3", "narrative_demo_v5",
                    "workflow_tasks_v8", "users_v9", "roles_v9",
                    "assignable_murals_v9", "ai_candidate_MURAL-02315"):
            self.assertIn(key, state)
        self.assertEqual(len(state["assignable_murals_v9"]), 8)
        # ai_candidate 键存在且带版本号（具体版本取决于此前是否运行过 ai/run）
        self.assertTrue(state["ai_candidate_MURAL-02315"]["versions"]["candidate"].startswith("v"))

    def test_state_roundtrip(self):
        murals = self.client.get("/api/bootstrap").json()["assignable_murals_v9"]
        murals[0]["risk"] = 99
        r = self.client.post("/api/state/assignable_murals_v9", json=murals)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.client.get("/api/bootstrap").json()
                         ["assignable_murals_v9"][0]["risk"], 99)

    def test_state_whitelist_rejects_unknown_key(self):
        r = self.client.post("/api/state/evil_key", json={"a": 1})
        self.assertEqual(r.status_code, 400)

    def test_samples(self):
        self.assertEqual(len(self.client.get("/api/samples").json()), 8)
        r = self.client.get("/api/samples/MURAL-02314")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["name"], "乐舞图")
        self.assertEqual(self.client.get("/api/samples/NOPE").status_code, 404)

    def test_ai_run_real_result(self):
        """真实运行：v3 -> v4，返回 stages 与 candidate，且服务端已持久化。"""
        r = self.client.post("/api/ai/run", json={"mural_id": "MURAL-02315"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["version"], "v4")
        self.assertEqual(len(data["stages"]), 8)
        self.assertTrue(all(s["status"] == "done" for s in data["stages"]))
        self.assertEqual(data["candidate"]["versions"]["candidate"], "v4")
        # 持久化
        stored = self.client.get("/api/bootstrap").json()["ai_candidate_MURAL-02315"]
        self.assertEqual(stored["versions"]["candidate"], "v4")
        # 运行历史
        runs = self.client.get("/api/ai/runs").json()
        self.assertEqual(runs[0]["mural_id"], "MURAL-02315")
        # 再次运行 -> v5（真实递增）
        r2 = self.client.post("/api/ai/run", json={"mural_id": "MURAL-02315"})
        self.assertEqual(r2.json()["version"], "v5")

    def test_ai_run_unknown_mural(self):
        r = self.client.post("/api/ai/run", json={"mural_id": "NOPE"})
        self.assertEqual(r.status_code, 404)

    def test_export_json(self):
        r = self.client.get("/api/export?format=json")
        self.assertEqual(r.status_code, 200)
        doc = r.json()
        self.assertEqual(doc["mural_id"], "MURAL-02315")
        meta = doc["export_meta"]
        self.assertTrue(meta["qc_passed"])
        self.assertIn("exported_at", meta)

    def test_export_jsonl(self):
        r = self.client.get("/api/export?format=jsonl")
        self.assertEqual(r.status_code, 200)
        lines = [l for l in r.text.splitlines() if l.strip()]
        kinds = []
        for l in lines:
            import json
            kinds.append(json.loads(l)["kind"])
        self.assertEqual(kinds[0], "document_header")
        self.assertIn("entity", kinds)
        self.assertIn("relation", kinds)

    def test_frontend_index_served(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("壁画结构化语义标注系统", r.text)
        r2 = self.client.get("/ai-run.html")
        self.assertEqual(r2.status_code, 200)
        self.assertIn("/api/ai/run", r2.text)
        # 静态资源
        r3 = self.client.get("/assets/shared.js")
        self.assertEqual(r3.status_code, 200)
        self.assertIn("/api/bootstrap", r3.text)


if __name__ == "__main__":
    unittest.main()
