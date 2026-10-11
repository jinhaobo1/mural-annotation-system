# -*- coding: utf-8 -*-
# Owner: 蔡振翰（B丙·数据导出部署）
"""导出：把审核草稿（review_draft）构建为标准导出文档，再序列化为 JSON / JSONL。

导出文档附带 QC 校验结果（见 qc.validate_document）。
"""
import datetime

from . import qc


def _now():
    """返回当前时间的 ISO 字符串（秒级精度）。"""
    return datetime.datetime.now().isoformat(timespec="seconds")


def build_document(draft, extra=None):
    """把草稿 draft 组装成标准导出文档（含元数据 + 实体/关系/事件 + QC 报告）。

    TODO: 组装标准结构，末尾调用 qc.validate_document 附上校验结果。
    """
    raise NotImplementedError("TODO: 构建导出文档结构")


def to_json(doc):
    """序列化为 JSON 字符串（缩进、保证中文可读）。"""
    raise NotImplementedError("TODO: json.dumps(doc, ensure_ascii=False, indent=2)")


def to_jsonl(doc):
    """序列化为 JSONL 字符串（每行一条记录）。"""
    raise NotImplementedError("TODO: 将 doc 拆为多行 JSON 记录")
