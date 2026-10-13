# -*- coding: utf-8 -*-
# Owner: 蔡振翰（B丙·数据导出部署）
"""种子数据：与前端模板（shared.js 内置默认值）完全一致，作为 SQLite 首次初始化数据。"""

# 可分配壁画（与 shared.js defaultAssignableMurals 一致）
ASSIGNABLE_MURALS = [
    {"id": "MURAL-02315", "name": "人物图", "caption": "绘一男一女。左侧男子头戴尖山小冠，身穿淡土红色交社衫，拱手，似施礼。右侧女子头梳倭堕髻，身穿淡土红色交社百戏衫，系淡土红色曳地长裙。腹部隆起，左手置腹前，右手指点。", "risk": 62, "status": "AI_READY", "volume": "示例卷", "selected": True},
    {"id": "MURAL-02314", "name": "乐舞图", "caption": "画面人物分上下两排，上排四人盘腿而坐，正观赏舞蹈，人物前面地面上左右各置一盘，盘内置放耳杯。下排四人作舞蹈状，左侧一女子长袖起舞，右侧三女身着曳地长裙，作细步曼舞状。", "risk": 78, "status": "AI_READY", "volume": "示例卷", "selected": True},
    {"id": "MURAL-02312", "name": "仪仗人物图", "caption": "画面可见多人组成仪卫行列。", "risk": 71, "status": "AI_READY", "volume": "示例卷", "selected": False},
    {"id": "MURAL-02311", "name": "宴饮图", "caption": "画面上部为宴饮，下部为厨炊。", "risk": 55, "status": "AI_READY", "volume": "示例卷", "selected": False},
    {"id": "MURAL-02310", "name": "车马出行图", "caption": "人物与车马组成出行队列。", "risk": 83, "status": "AI_READY", "volume": "示例卷", "selected": False},
    {"id": "MURAL-02309", "name": "门吏图", "caption": "门侧立一人，似为文职幕僚。", "risk": 88, "status": "AI_READY", "volume": "示例卷", "selected": False},
    {"id": "MURAL-02308", "name": "朱雀图", "caption": "画面绘朱雀形象。", "risk": 31, "status": "AI_READY", "volume": "示例卷", "selected": False},
    {"id": "MURAL-02307", "name": "庖厨图", "caption": "画面表现厨炊活动与器物。", "risk": 60, "status": "AI_READY", "volume": "示例卷", "selected": False},
]

# 当前工作样本（与 shared.js getSampleMeta 默认值一致）
SAMPLE_META = {
    "mural_id": "MURAL-02315",
    "name": "人物图",
    "image": "assets/sample_mural.png",
    "caption": "绘一男一女。左侧男子头戴尖山小冠，身穿淡土红色交社衫，拱手，似施礼。右侧女子头梳倭堕髻，身穿淡土红色交社百戏衫，系淡土红色曳地长裙。腹部隆起，左手置腹前，右手指点。",
}

# 审核草稿（与 shared.js getReviewDraft 默认值一致：E1/E2 双人物 + left_of 关系）
REVIEW_DRAFT = {
    "sample": {**SAMPLE_META, "view_type": "full_scene", "source_group_id": "SCENE-02315"},
    "scene": {"themes": ["人物生活"]},
    "regions": [],
    "entities": [
        {"id": "E1", "base_category": "HUMAN", "level1_category": "HUMAN", "level2_category": "HUMAN_ORDINARY", "level3_category": "GENERIC_PERSON", "sub_category": "普通人物", "fine_category": {"value": "普通人物（未细分）", "taxonomy_id": "GENERIC_PERSON", "certainty": "certain", "evidence": ["caption_explicit"], "ai_confidence": 0.93}, "bbox": [160, 390, 500, 700], "attributes": [{"name": "gender", "value": "男", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.98}, {"name": "headwear", "value": "尖山小冠", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.96}], "states": [], "actions": [{"name": "gesture", "value": "拱手", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.91}, {"name": "action", "value": "施礼", "certainty": "probable", "evidence": "caption_explicit", "ai_confidence": 0.68}], "visibility": "clear", "source_type": "caption_grounded"},
        {"id": "E2", "base_category": "HUMAN", "level1_category": "HUMAN", "level2_category": "HUMAN_ORDINARY", "level3_category": "GENERIC_PERSON", "sub_category": "普通人物", "fine_category": {"value": "普通人物（未细分）", "taxonomy_id": "GENERIC_PERSON", "certainty": "certain", "evidence": ["caption_explicit"], "ai_confidence": 0.91}, "bbox": [480, 410, 820, 710], "attributes": [{"name": "gender", "value": "女", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.98}, {"name": "hairstyle", "value": "倭堕髻", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.88}, {"name": "lower_garment", "value": "淡土红色曳地长裙", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.90}, {"name": "body_feature", "value": "腹部隆起", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.82}], "states": [], "actions": [{"name": "action", "value": "指点", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.84}], "visibility": "clear", "source_type": "caption_grounded"},
    ],
    "groups": [],
    "events": [],
    "relations": [{"subject": "E1", "predicate": "left_of", "object": "E2", "certainty": "certain", "ai_confidence": 0.96}],
    "qc_issues": [],
}

# 叙事标注示例（与 shared.js getNarrativeDemo 默认值一致）
NARRATIVE_DEMO = {
    "source_caption": "画面人物分上下两排，上排四人盘腿而坐，正观赏舞蹈，人物前面地面上左右各置一盘，盘内置放耳杯。下排四人作舞蹈状，左侧一女子长袖起舞，右侧三女身着曳地长裙，作细步曼舞状。",
    "groups": [
        {"id": "G1", "type": "观众组", "count": 4, "count_type": "exact", "layout": "上排", "members": [], "shared_attributes": [], "shared_states": [{"name": "posture", "value": "盘腿而坐", "certainty": "certain"}], "shared_actions": [{"name": "social_action", "value": "观赏", "certainty": "certain"}], "subgroup_of": None},
        {"id": "G2", "type": "舞者组", "count": 4, "count_type": "exact", "layout": "下排", "members": [], "shared_attributes": [], "shared_states": [], "shared_actions": [{"name": "performance_action", "value": "舞蹈", "certainty": "certain"}], "subgroup_of": None},
        {"id": "G3", "type": "人物子组", "count": 3, "count_type": "exact", "layout": "右侧", "members": [], "shared_attributes": [{"name": "gender", "value": "女", "certainty": "certain"}, {"name": "lower_garment", "value": "曳地长裙", "certainty": "certain"}], "shared_states": [], "shared_actions": [{"name": "performance_action", "value": "细步曼舞", "certainty": "certain"}], "subgroup_of": "G2"},
    ],
    "events": [
        {"id": "EV1", "family": "PERFORMANCE", "type": "舞蹈", "region": None, "participants": [{"node": "G2", "role": "performer"}, {"node": "G1", "role": "observer"}], "certainty": "certain"},
    ],
    "relations": [
        {"subject": "G1", "predicate": "above", "object": "G2", "certainty": "certain"},
        {"subject": "G3", "predicate": "subgroup_of", "object": "G2", "certainty": "certain"},
    ],
}

# 工作流任务（与 shared.js defaultWorkflowTasks 一致）
WORKFLOW_TASKS = [
    {"id": "TASK-001", "name": "人物图 AI 结果审核", "sample_ids": ["MURAL-02315"], "sample_count": 1, "reviewer": "reviewer_01", "expert": "expert_01", "priority": "高", "due": "2026-10-02", "status": "REVIEW_ASSIGNED", "ai_status": "AI_READY", "progress": 0, "created_by": "admin_01"},
    {"id": "TASK-002", "name": "乐舞图批次审核", "sample_ids": ["MURAL-02314", "MURAL-02312", "MURAL-02311"], "sample_count": 24, "reviewer": "reviewer_01", "expert": "expert_01", "priority": "普通", "due": "2026-10-05", "status": "IN_REVIEW", "ai_status": "AI_READY", "progress": 9, "created_by": "admin_01"},
    {"id": "TASK-003", "name": "仪仗类专家复核", "sample_ids": ["MURAL-02313"], "sample_count": 8, "reviewer": "reviewer_02", "expert": "expert_01", "priority": "高", "due": "2026-10-01", "status": "EXPERT_REVIEW", "ai_status": "AI_READY", "progress": 8, "created_by": "admin_01"},
    {"id": "TASK-004", "name": "河北卷管理员验收", "sample_ids": ["MURAL-02190"], "sample_count": 12, "reviewer": "reviewer_02", "expert": "expert_02", "priority": "普通", "due": "2026-10-03", "status": "ADMIN_ACCEPTANCE", "ai_status": "AI_READY", "progress": 12, "created_by": "admin_01"},
]

# 用户（与 shared.js defaultUsers 一致）
USERS = [
    {"id": "U001", "username": "admin_01", "name": "项目管理员", "role": "admin", "status": "active"},
    {"id": "U002", "username": "reviewer_01", "name": "审核员一", "role": "reviewer", "status": "active"},
    {"id": "U003", "username": "reviewer_02", "name": "审核员二", "role": "reviewer", "status": "active"},
    {"id": "U004", "username": "reviewer_03", "name": "审核员三", "role": "reviewer", "status": "active"},
    {"id": "U005", "username": "expert_01", "name": "专家一", "role": "expert", "status": "active"},
    {"id": "U006", "username": "expert_02", "name": "专家二", "role": "expert", "status": "active"},
    {"id": "U007", "username": "researcher_01", "name": "研究用户", "role": "researcher", "status": "active"},
]

# 角色（与 shared.js defaultRoles 一致）
ROLES = [
    {"code": "admin", "name": "管理员", "description": "项目配置、数据、任务分配、AI配置、最终验收", "permissions": ["project.manage", "sample.manage", "ai.manage", "task.assign", "workflow.manage", "taxonomy.manage", "qc.manage", "user.manage", "role.manage", "approve.final", "export.all"], "system": True},
    {"code": "reviewer", "name": "标注审核员", "description": "处理分配给自己的 AI 标注审核任务", "permissions": ["task.mine", "annotation.review", "json.preview", "history.mine"], "system": True},
    {"code": "expert", "name": "专家审核员", "description": "处理分配给自己的专家复核任务", "permissions": ["expert.mine", "annotation.review", "taxonomy.read", "json.preview", "history.expert"], "system": True},
    {"code": "researcher", "name": "只读研究员", "description": "只读浏览 Approved 数据并按授权导出", "permissions": ["approved.read", "version.read", "export.approved"], "system": True},
]


# 历史 AI 候选（v3）：与页面文案"AI Candidate v4 已创建"衔接——首次真实运行生成 v4
AI_CANDIDATE_V3 = {
    "mural_id": "MURAL-02315",
    "name": "人物图",
    "image": "assets/sample_mural.png",
    "caption": ASSIGNABLE_MURALS[0]["caption"],
    "view_type": "full_scene",
    "source_group_id": "SCENE-02315",
    "workflow_status": "AI_READY",
    "versions": {"candidate": "v3", "reviewed": None, "approved": None},
    "scene": {"annotations": ["人物生活"]},
    "regions": [],
    "entities": [REVIEW_DRAFT["entities"][0], REVIEW_DRAFT["entities"][1]],
    "groups": [],
    "events": [],
    "relations": [{"id": "R1", "family": "SPATIAL", "predicate": "left_of", "subject": "E1", "object": "E2", "certainty": "certain", "evidence": "caption_explicit", "ai_confidence": 0.96, "review_status": "pending"}],
    "qc_issues": [{"code": "CAPTION_ONLY", "severity": "info", "message": "AI 仅基于 caption 文本标注，bbox 为版面推定（layout_estimated）", "node": None}],
    "ai_meta": {"engine": "rule-based-8pass", "pipeline": "S0-S7", "fingerprint": "seed-v3", "risk_score": 62},
}


def default_state():
    """首次启动写入 state 表的默认键值（键名与前端 localStorage 完全一致）"""
    return {
        "sample_meta": SAMPLE_META,
        "review_draft_v3": REVIEW_DRAFT,
        "narrative_demo_v5": NARRATIVE_DEMO,
        "workflow_tasks_v8": WORKFLOW_TASKS,
        "users_v9": USERS,
        "roles_v9": ROLES,
        "assignable_murals_v9": ASSIGNABLE_MURALS,
        "ai_candidate_MURAL-02315": AI_CANDIDATE_V3,
    }
