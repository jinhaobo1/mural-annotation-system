# -*- coding: utf-8 -*-
"""FastAPI 入口：前端静态托管 + REST API。

API 一览（签名已定，逻辑待填）：
  GET  /api/health           健康检查
  GET  /api/bootstrap        首屏同步：返回 state 全量（前端启动时拉取灌入 localStorage）
  POST /api/state/{key}      写入白名单 state 键（前端 save* 镜像）
  GET  /api/samples          可分配壁画列表
  GET  /api/samples/{id}     单幅壁画详情
  POST /api/ai/run           运行真实 8-pass 标注引擎 {mural_id}
  GET  /api/ai/runs          AI 运行历史
  GET  /api/export           导出审核草稿 format=json|jsonl
"""
import os
import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import db as db_mod
from . import exporter
from .annotator import run_annotation

FRONTEND_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

app = FastAPI(title="壁画结构化语义标注系统 API", version="9.0")
database = db_mod.Database()


def _now():
    """返回当前时间的 ISO 字符串（秒级精度）。"""
    return datetime.datetime.now().isoformat(timespec="seconds")


# ---------- API ----------

@app.get("/api/health")
def health():
    """健康检查：返回 ok 标志、当前时间、已收录壁画数量。"""
    raise NotImplementedError("TODO: 返回 {ok, time, murals 数量}")


@app.get("/api/bootstrap")
def bootstrap():
    """前端启动同步：返回 state 全量（与 localStorage 键一一对应）。"""
    raise NotImplementedError("TODO: 返回 database.all_state()")


@app.post("/api/state/{key}")
async def put_state(key: str, request: Request):
    """写入白名单 state 键；请求体必须为合法 JSON，非法键返回 400。"""
    raise NotImplementedError("TODO: 解析 JSON → database.set_state(key, payload)")


@app.get("/api/samples")
def samples():
    """返回可分配壁画列表。"""
    raise NotImplementedError("TODO: 返回 database.list_murals()")


@app.get("/api/samples/{mural_id}")
def sample(mural_id: str):
    """返回单幅壁画详情；不存在返回 404。"""
    raise NotImplementedError("TODO: database.get_mural(mural_id)，缺失则 404")


class RunRequest(BaseModel):
    """AI 运行请求体。"""
    mural_id: str = "MURAL-02315"


@app.post("/api/ai/run")
def ai_run(req: RunRequest):
    """运行 S0-S7 八步标注引擎；结果写入 state(ai_candidate_<id>) 并记录 ai_runs。

    返回：{ok, run_id, mural_id, version, risk_score, stages, candidate}。
    """
    raise NotImplementedError("TODO: 取 mural → run_annotation → set_state + add_ai_run")


@app.get("/api/ai/runs")
def ai_runs(limit: int = 50):
    """返回最近 AI 运行历史。"""
    raise NotImplementedError("TODO: 返回 database.list_ai_runs(limit)")


@app.get("/api/export")
def export(format: str = "json", draft_key: str = "review_draft_v3"):
    """导出审核草稿为标准 JSON / JSONL（附带导出 QC 校验结果）。"""
    raise NotImplementedError("TODO: 取 draft → exporter.build_document → to_json/to_jsonl")


# ---------- 前端静态托管（必须放在最后）----------
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
