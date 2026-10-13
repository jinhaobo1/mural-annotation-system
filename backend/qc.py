# -*- coding: utf-8 -*-
# Owner: 贾涵玉（A乙·体系与评测）
"""导出前 QC 校验（对应教程导出规范）：对将要导出的结构化 JSON 做机器校验。

校验项：
  MURAL_ID_REQUIRED  缺少壁画编号
  QC_BBOX_INVALID   实体 bbox 无效（需 [x1,y1,x2,y2] 且 x2>x1, y2>y1）
  CERTAINTY_CHECK    存在 probable 事实（导出时允许，但记录提醒人工复核）
  RELATION_VALID     关系的主语/宾语引用了不存在的节点
  SCENE_HIERARCHY    scene.annotations 为空
"""


def validate_document(doc):
    """返回 (passed, issues)；issues 为 [{code, severity, message, node}]。"""
    issues = []

    if not doc.get("mural_id"):
        issues.append({"code": "MURAL_ID_REQUIRED", "severity": "error",
                       "message": "文档缺少 mural_id", "node": None})

    # 收集所有合法节点 id
    node_ids = set()
    for e in doc.get("entities", []):
        node_ids.add(e.get("id"))
        bbox = e.get("bbox")
        if e.get("bbox") is not None and not (
                isinstance(bbox, list) and len(bbox) == 4
                and bbox[2] > bbox[0] and bbox[3] > bbox[1]):
            issues.append({"code": "QC_BBOX_INVALID", "severity": "error",
                           "message": "实体 %s bbox 无效：%r" % (e.get("id"), bbox),
                           "node": e.get("id")})
    for g in doc.get("groups", []):
        node_ids.add(g.get("id"))
    for r in doc.get("regions", []):
        node_ids.add(r.get("id"))

    probable = 0
    for item in doc.get("entities", []) + doc.get("groups", []):
        for k in ("attributes", "states", "actions",
                  "shared_attributes", "shared_states", "shared_actions"):
            for f in item.get(k, []):
                if isinstance(f, dict) and f.get("certainty") == "probable":
                    probable += 1
    for r in doc.get("relations", []):
        if r.get("certainty") == "probable":
            probable += 1
        for side in ("subject", "object"):
            if r.get(side) and r[side] not in node_ids:
                issues.append({"code": "RELATION_VALID", "severity": "error",
                               "message": "关系 %s 的 %s 引用不存在节点 %s"
                                          % (r.get("id", "?"), side, r[side]),
                               "node": r.get("id")})
    if probable:
        issues.append({"code": "CERTAINTY_CHECK", "severity": "warning",
                       "message": "%d 条事实为 probable，导出时保留不确定性并提示人工复核" % probable,
                       "node": None})

    scene = doc.get("scene") or {}
    if not scene.get("annotations"):
        issues.append({"code": "SCENE_HIERARCHY", "severity": "warning",
                       "message": "scene.annotations 为空", "node": None})

    passed = not any(i["severity"] == "error" for i in issues)
    return passed, issues
