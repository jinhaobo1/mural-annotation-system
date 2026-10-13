# -*- coding: utf-8 -*-
# Owner: 韩雨杰（B甲·后端）
"""SQLite 持久化层。

表结构：
  state(key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)   -- 前端 localStorage 的服务端镜像
  ai_runs(run_id INTEGER PRIMARY KEY AUTOINCREMENT,
          mural_id TEXT, version TEXT, created_at TEXT, result TEXT) -- AI 标注运行记录
"""
import json
import os
import sqlite3
import threading
import datetime
from . import seed_data

# state 表允许同步的键（与前端 localStorage 键一一对应）
STATE_KEYS = {
    "sample_meta", "review_draft_v3", "custom_taxonomy_v4",
    "narrative_demo_v5", "workflow_tasks_v8", "users_v9",
    "roles_v9", "assignable_murals_v9",
}


def _now():
    return datetime.datetime.now().isoformat(timespec="seconds")


class Database:
    def __init__(self, path=None):
        if path is None:
            path = os.environ.get("MURAL_DB_PATH") or os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mural.db")
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        self.path = path
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL")
        self._init_schema()
        self._seed_if_empty()

    # ---------- 基础 ----------
    def _init_schema(self):
        with self._lock:
            cur = self._conn
            cur.execute("""CREATE TABLE IF NOT EXISTS state(
                key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)""")
            cur.execute("""CREATE TABLE IF NOT EXISTS ai_runs(
                run_id INTEGER PRIMARY KEY AUTOINCREMENT,
                mural_id TEXT NOT NULL, version TEXT NOT NULL,
                created_at TEXT NOT NULL, result TEXT NOT NULL)""")
            cur.commit()

    def _seed_if_empty(self):
        with self._lock:
            n = self._conn.execute("SELECT COUNT(*) FROM state").fetchone()[0]
            if n:
                return
            for key, value in seed_data.default_state().items():
                self._conn.execute(
                    "INSERT OR REPLACE INTO state(key,value,updated_at) VALUES(?,?,?)",
                    (key, json.dumps(value, ensure_ascii=False), _now()))
            self._conn.commit()

    # ---------- state ----------
    def get_state(self, key):
        row = self._conn.execute("SELECT value FROM state WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else None

    def set_state(self, key, value):
        if key not in STATE_KEYS and not key.startswith("ai_candidate_"):
            raise KeyError("非法 state 键: %s" % key)
        with self._lock:
            self._conn.execute(
                "INSERT OR REPLACE INTO state(key,value,updated_at) VALUES(?,?,?)",
                (key, json.dumps(value, ensure_ascii=False), _now()))
            self._conn.commit()

    def all_state(self):
        rows = self._conn.execute("SELECT key,value FROM state").fetchall()
        return {k: json.loads(v) for k, v in rows}

    # ---------- ai_runs ----------
    def add_ai_run(self, mural_id, version, result):
        with self._lock:
            cur = self._conn.execute(
                "INSERT INTO ai_runs(mural_id,version,created_at,result) VALUES(?,?,?,?)",
                (mural_id, version, _now(),
                 json.dumps(result, ensure_ascii=False)))
            self._conn.commit()
            return cur.lastrowid

    def ai_run_count(self, mural_id):
        return self._conn.execute(
            "SELECT COUNT(*) FROM ai_runs WHERE mural_id=?", (mural_id,)).fetchone()[0]

    def list_ai_runs(self, limit=50):
        rows = self._conn.execute(
            "SELECT run_id,mural_id,version,created_at FROM ai_runs "
            "ORDER BY run_id DESC LIMIT ?", (limit,)).fetchall()
        return [{"run_id": r[0], "mural_id": r[1], "version": r[2], "created_at": r[3]}
                for r in rows]

    # ---------- 业务辅助 ----------
    def get_mural(self, mural_id):
        for m in self.get_state("assignable_murals_v9") or []:
            if m.get("id") == mural_id:
                return m
        return None

    def list_murals(self):
        return self.get_state("assignable_murals_v9") or []
