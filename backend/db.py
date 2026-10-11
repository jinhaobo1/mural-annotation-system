# -*- coding: utf-8 -*-
# Owner: 韩雨杰（B甲·后端）
"""SQLite 持久化层：state 镜像表 + ai_runs 运行记录。

设计约定：
- 数据库是系统唯一事实源（WAL 模式）
- 前端 localStorage 的每个键都镜像到 state 表（key/value JSON）
- ai_runs 记录每次 AI 标注运行的版本递增与风险评分
"""
import os
import datetime

# 默认数据库路径（可用环境变量 MURAL_DB_PATH 覆盖）
DEFAULT_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mural.db")

# 允许前端写入的 state 键白名单（与前端 localStorage 键一致）
STATE_KEYS = [
    "sample_meta",
    "review_draft_v3",
    "custom_taxonomy_v4",
    "narrative_demo_v5",
    "workflow_tasks_v8",
    "users_v9",
    "roles_v10",
    # ... 其余白名单键按需补齐
]


def _now():
    """返回当前时间的 ISO 字符串（秒级精度）。"""
    return datetime.datetime.now().isoformat(timespec="seconds")


class Database:
    """SQLite 封装：连接管理、建表、state 读写、ai_runs 记录。"""

    def __init__(self, path=None):
        """初始化数据库连接。

        TODO: 连接 SQLite（启用 WAL）→ 调用 _init_schema() → _seed_if_empty()。
        路径：优先 path 参数，其次环境变量 MURAL_DB_PATH，最后 DEFAULT_DB_PATH。
        """
        self.path = path or os.environ.get("MURAL_DB_PATH") or DEFAULT_DB_PATH
        # TODO: 建立连接、开启 WAL、建表、空库播种
        raise NotImplementedError("TODO: 完成 Database.__init__（连接 + 建表 + 播种）")

    def _init_schema(self):
        """创建表结构：state(key TEXT PRIMARY KEY, value TEXT, updated_at) 与 ai_runs。"""
        raise NotImplementedError("TODO: 建表 state + ai_runs")

    def _seed_if_empty(self):
        """空库时播种种子数据（调用 seed_data.default_state()）。"""
        raise NotImplementedError("TODO: 空库播种")

    def get_state(self, key):
        """读取单个 state 键的值（JSON 反序列化后返回）；不存在返回 None。"""
        raise NotImplementedError("TODO: 返回 state[key]")

    def set_state(self, key, value):
        """写入单个 state 键（JSON 序列化存储）；key 不在白名单时抛 KeyError。"""
        raise NotImplementedError("TODO: 白名单校验 + upsert state[key]")

    def all_state(self):
        """返回全部 state（dict：key -> 反序列化后的值）。"""
        raise NotImplementedError("TODO: 返回 {key: value, ...}")

    def add_ai_run(self, mural_id, version, result):
        """记录一次 AI 运行，返回 run_id。result 为 {risk_score, stages} 摘要。"""
        raise NotImplementedError("TODO: 插入 ai_runs，返回自增 run_id")

    def ai_run_count(self, mural_id):
        """返回某壁画的历史 AI 运行次数。"""
        raise NotImplementedError("TODO: 返回计数")

    def list_ai_runs(self, limit=50):
        """按时间倒序返回最近 limit 条 AI 运行记录。"""
        raise NotImplementedError("TODO: 返回运行记录列表")

    def get_mural(self, mural_id):
        """读取单幅壁画（含 caption、图像路径等）；不存在返回 None。"""
        raise NotImplementedError("TODO: 返回壁画详情")

    def list_murals(self):
        """返回全部壁画列表（用于 samples 接口）。"""
        raise NotImplementedError("TODO: 返回壁画列表")
