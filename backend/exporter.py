# -*- coding: utf-8 -*-
# Owner: 蔡振翰（B丙·数据导出部署）
"""导出模块：把审核草稿 / AI 候选导出为标准 JSON / JSONL（对应教程导出规范）。"""
import json
import datetime
from . import qc


def _now():
    return datetime.datetime.now().isoformat(timespec="seconds")


def build_document(draft, extra=None):
    """把前端 review_draft 结构包装成导出文档，并附加导出元数据与 QC 校验结果。"""
    doc = dict(draft)
    doc.setdefault("mural_id", (doc.get("sample") or {}).get("mural_id"))
    passed, issues = qc.validate_document(doc)
    doc["export_meta"] = {
        "exported_at": _now(),
        "format_version": "9.0",
        "qc_passed": passed,
        "qc_issues": issues,
    }
    if extra:
        doc["export_meta"]["included_ai_candidates"] = extra
    return doc


def to_json(doc):
    return json.dumps(doc, ensure_ascii=False, indent=2)


def to_jsonl(doc):
    """扁平化为 JSONL：一行一个标注节点（scene/entity/group/event/relation/qc）。"""
    lines = []
    header = {
        "kind": "document_header",
        "mural_id": doc.get("mural_id"),
        "name": doc.get("sample", {}).get("name") or doc.get("name"),
        "versions": doc.get("versions"),
        "exported_at": doc.get("export_meta", {}).get("exported_at"),
    }
    lines.append(header)
    for a in (doc.get("scene") or {}).get("annotations", []):
        lines.append({"kind": "scene", "value": a})
    for e in doc.get("entities", []):
        lines.append({"kind": "entity", **e})
    for g in doc.get("groups", []):
        lines.append({"kind": "group", **g})
    for ev in doc.get("events", []):
        lines.append({"kind": "event", **ev})
    for r in doc.get("relations", []):
        lines.append({"kind": "relation", **r})
    for q in doc.get("qc_issues", []):
        lines.append({"kind": "qc_issue", **q})
    return "\n".join(json.dumps(l, ensure_ascii=False) for l in lines) + "\n"
