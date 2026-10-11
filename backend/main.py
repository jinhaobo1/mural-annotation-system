# -*- coding: utf-8 -*-
# Owner: 韩雨杰（B甲·后端）
"""FastAPI 入口：前端静态托管 + REST API。
API 一览：
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
    return datetime.datetime.now().isoformat(timespec="seconds")
# ---------- API ----------
@app.get("/api/health")
def health():
    return {"ok": True, "time": _now(), "murals": len(database.list_murals())}
@app.get("/api/bootstrap")
def bootstrap():
    """前端启动同步：全量 state（与 localStorage 键一一对应）。"""
    return database.all_state()
@app.post("/api/state/{key}")
async def put_state(key: str, request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="请求体必须是合法 JSON")
    try:
        database.set_state(key, payload)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "key": key, "updated_at": _now()}
@app.get("/api/samples")
def samples():
    return database.list_murals()
@app.get("/api/samples/{mural_id}")
def sample(mural_id: str):
    mural = database.get_mural(mural_id)
    if not mural:
        raise HTTPException(status_code=404, detail="mural not found: %s" % mural_id)
    return mural
class RunRequest(BaseModel):
    mural_id: str = "MURAL-02315"
@app.post("/api/ai/run")
def ai_run(req: RunRequest):
    """运行真实 S0-S7 八步标注引擎；结果存入 state(ai_candidate_<id>) 并记录 ai_runs。"""
    mural = database.get_mural(req.mural_id)
    if not mural:
        raise HTTPException(status_code=404, detail="mural not found: %s" % req.mural_id)
    prev = database.get_state("ai_candidate_" + req.mural_id)
    stages, candidate, risk = run_annotation(mural, prev)
    database.set_state("ai_candidate_" + req.mural_id, candidate)
    run_id = database.add_ai_run(req.mural_id, candidate["versions"]["candidate"],
                                 {"risk_score": risk, "stages": stages})
    return {"ok": True, "run_id": run_id, "mural_id": req.mural_id,
            "version": candidate["versions"]["candidate"],
            "risk_score": risk, "stages": stages, "candidate": candidate}
@app.get("/api/ai/runs")
def ai_runs(limit: int = 50):
    return database.list_ai_runs(limit)
@app.get("/api/export")
def export(format: str = "json", draft_key: str = "review_draft_v3"):
    """导出审核草稿为标准 JSON / JSONL（附带导出 QC 校验结果）。"""
    draft = database.get_state(draft_key)
    if not draft:
        raise HTTPException(status_code=404, detail="draft not found: %s" % draft_key)
    doc = exporter.build_document(draft)
    if format == "jsonl":
        return PlainTextResponse(exporter.to_jsonl(doc), media_type="application/jsonl")
    if format != "json":
        raise HTTPException(status_code=400, detail="unsupported format: %s" % format)
    return JSONResponse(doc)
# ---------- 前端静态托管（必须放在最后）----------
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
