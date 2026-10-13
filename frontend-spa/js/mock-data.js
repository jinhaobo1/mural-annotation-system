(function () {
  const seedMurals = Array.isArray(window.SeedMurals) ? window.SeedMurals : [];
  const seededSamples = seedMurals.map((item, index) => ({
    id: `MURAL-${String(item.id).padStart(3, '0')}`,
    title: item.name,
    category: item.category,
    caption: item.description,
    status: index < 10 ? 'AI_READY' : 'RAW_READY',
    risk: (Number(item.id) * 17) % 95,
    version: index < 10 ? `candidate v${(index % 3) + 1}` : 'raw',
    accent: ['ochre', 'sand', 'ink', 'blue', 'vermilion'][index % 5],
    image_url: item.image_url,
    image_name: item.image_name,
    dynasty: item.dynasty,
    site: item.site,
    confidence: item.confidence
  }));
  const samples = seededSamples.length ? seededSamples : [
    { id: 'MURAL-02315', title: '人物图', category: '人物画', caption: '绘一男一女，左侧男子头戴尖山小冠，右侧女子身着长裙。', status: 'AI_READY', risk: 62, version: 'candidate v3', accent: 'ochre' },
    { id: 'MURAL-02314', title: '乐舞图', category: '乐舞图', caption: '画面人物分上下两排，上排四人盘腿而坐，下排人物持乐器。', status: 'RAW_READY', risk: null, version: 'raw', accent: 'sand' },
    { id: 'MURAL-02313', title: '仪仗队列', category: '仪仗图', caption: '14 人组成的仪仗行列，人物朝向一致，手持长柄器物。', status: 'APPROVED', risk: 18, version: 'approved v2', accent: 'ink' },
    { id: 'MURAL-02312', title: '仪仗人物图', category: '仪仗图', caption: '画面可见多人组成仪仗行列，人物服饰层次清晰。', status: 'AI_READY', risk: 71, version: 'candidate v2', accent: 'blue' },
    { id: 'MURAL-02311', title: '宴饮图', category: '宴饮图', caption: '画面上部为宴饮，下部为厨炊，器物与人物关系明确。', status: 'AI_READY', risk: 55, version: 'candidate v1', accent: 'vermilion' },
    { id: 'MURAL-02310', title: '车马出行图', category: '出行图', caption: '人物与车马组成出行队列，车具结构可辨。', status: 'AI_READY', risk: 83, version: 'candidate v4', accent: 'slate' },
    { id: 'MURAL-02309', title: '门吏图', category: '人物画', caption: '门侧立一人，似为文职幕僚，双手执笏。', status: 'AI_READY', risk: 88, version: 'candidate v2', accent: 'gold' },
    { id: 'MURAL-02308', title: '朱雀图', category: '祥瑞图', caption: '画面绘朱雀形象，双翼展开，尾羽上扬。', status: 'AI_READY', risk: 31, version: 'candidate v1', accent: 'jade' },
    { id: 'MURAL-02307', title: '庖厨图', category: '宴饮图', caption: '画面表现厨炊活动与器物，人物动作具有叙事性。', status: 'AI_READY', risk: 60, version: 'candidate v2', accent: 'brown' }
  ];

  window.MockData = {
    project: {
      name: '壁画结构化语义标注项目',
      taxonomy: 'taxonomy v1.1-custom',
      slogan: 'AI标注 → 审核 → 专家复核 → 管理员验收'
    },
    overview: {
      stats: [
        { label: '样本总数', value: String(samples.length), hint: '种子数据', tone: 'green' },
        { label: 'AI_READY 待分配', value: String(samples.filter((sample) => sample.status === 'AI_READY').length), hint: '等待管理员指派', tone: 'green' },
        { label: '专家复核中', value: '3', hint: '跨任务统计', tone: 'green' },
        { label: '待管理员验收', value: '2', hint: '可生成 Approved', tone: 'green' }
      ],
      funnel: [
        { label: 'AI Candidate', value: '1,842' },
        { label: '审核员完成', value: '1,386' },
        { label: '专家复核完成', value: '1,204' },
        { label: 'Approved', value: '1,127' }
      ],
      alerts: [
        { tone: 'danger', title: '3 张样本触发 BLOCKING', detail: 'QC_SCHEMA_INVALID · 需管理员处理后才能提交', action: '查看质检' },
        { tone: 'warning', title: '7 张高 AI 风险样本待分配', detail: '风险分 ≥ 78，建议优先安排专家审核', action: '前往分配' },
        { tone: 'info', title: 'taxonomy v1.1-custom 已发布', detail: '新增 HUMAN_PERFORMER 二级类别', action: '查看差异' }
      ],
      recent: samples.slice(0, 4).map((sample, index) => ({ id: sample.id, title: sample.title, status: sample.status, updated: `${(index + 1) * 7} 分钟前`, owner: index === 2 ? 'admin_01' : (index === 3 ? 'reviewer_02' : '未分配') }))
    },
    samples,
    assignment: {
      readySamples: samples.filter((sample) => sample.status === 'AI_READY'),
      reviewers: ['审核员一（reviewer_01）', '审核员二（reviewer_02）', '审核员三（reviewer_03）'],
      experts: ['专家一（expert_01）', '专家二（expert_02）']
    },
    aiTasks: [
      { id: 'BATCH-07', type: '批量', scope: '150 条', status: 'RUNNING', progress: 68, progressText: '102/150', errors: 3, updated: '运行 12 分钟' },
      { id: 'RUN-8891', type: '单张', scope: 'S-0002315', status: 'COMPLETED', progress: 100, progressText: '100%', errors: 0, updated: '今天 14:36' },
      { id: 'BATCH-06', type: '批量', scope: '80 条', status: 'COMPLETED', progress: 100, progressText: '80/80', errors: 1, updated: '今天 11:08' },
      { id: 'RUN-8889', type: '单张', scope: 'S-0002309', status: 'FAILED', progress: 46, progressText: '46%', errors: 2, updated: '昨天 18:42' }
    ],
    workflow: {
      lifecycle: ['raw', 'ai_candidate', 'reviewer', 'expert', 'admin_approved'],
      stages: [
        { stage: 'S0–S1', title: '预处理与 Caption 解析', tone: 'green' },
        { stage: 'S2–S4', title: '实体、属性与遗漏发现', tone: 'blue' },
        { stage: 'S5', title: '群组与事件构建', tone: 'violet' },
        { stage: 'S6–S7', title: '关系抽取与质检分级', tone: 'gray' }
      ],
      duties: [
        { title: '1. AI 自动标注 S0–S7', description: '输入 image + caption，生成 view_type / scene / region / entity / group / event / relation，并写入 certainty 与 visibility。' },
        { title: '2. 审核员', description: '只能处理分配给自己的任务；按教程逐项校正类别、BBox、Attribute/State/Action、Group/Event 与关系。' },
        { title: '3. 专家审核员', description: '复核专业身份、复杂叙事、不确定术语与跨模态冲突，重点确认 probable / possible / unknown 事实。' },
        { title: '4. 管理员', description: '检查 14 条质检规则、任务归属与版本信息；确认无 BLOCKING 后生成 Approved 入库。' }
      ],
      rules: [
        { title: 'AI 完成后必须由管理员分配', description: '不允许审核员自行认领未分配样本', enabled: true },
        { title: '专家复核为必经步骤', description: '所有 Reviewed 数据进入指定专家', enabled: true },
        { title: '管理员最终验收', description: '只有管理员可生成 Approved', enabled: true },
        { title: '提交前执行教程 8.1 自检', description: '整体信息、实体、语义、特殊信息四类检查均需通过', enabled: true }
      ],
      statusMap: ['EXPERT_REVIEW', 'ADMIN_ACCEPTANCE', 'APPROVED']
    },
    taxonomy: {
      version: 'v1.1-custom',
      tabs: ['实体分类', 'Scene 层级 / Event', 'Relation', 'Attribute / State / Action'],
      stats: [
        { label: '一级实体类别', value: '11' },
        { label: 'HUMAN 二级类别', value: '9' },
        { label: '一级场景类别', value: '14' },
        { label: '关系类型', value: '43 / 5 族' }
      ],
      tree: [
        { code: 'HUMAN', label: '人物', level: 0, open: true },
        { code: 'HUMAN_OWNER', label: '主人类', level: 1 },
        { code: 'HUMAN_ATTENDANT', label: '侍从类', level: 1 },
        { code: 'FEMALE_ATTENDANT', label: '侍女', level: 2 },
        { code: 'MALE_ATTENDANT', label: '男侍', level: 2 },
        { code: 'ATTENDANT_GENERIC', label: '侍者', level: 2 },
        { code: 'HUMAN_OFFICIAL', label: '官吏类', level: 1 },
        { code: 'HUMAN_MILITARY', label: '武职类', level: 1 },
        { code: 'HUMAN_PERFORMER', label: '乐舞表演类', level: 1 },
        { code: 'HUMAN_LABOR', label: '劳作类', level: 1 },
        { code: 'HUMAN_RELIGIOUS', label: '宗教人物类', level: 1 },
        { code: 'HUMAN_HISTORICAL', label: '历史人物类', level: 1 },
        { code: 'HUMAN_GENERIC', label: '普通人物', level: 1 },
        { code: 'ANIMAL', label: '真实动物', level: 0 },
        { code: 'SUPERNATURAL', label: '神异形象', level: 0 },
        { code: 'OBJECT', label: '器物', level: 0 },
        { code: 'FURNITURE', label: '家具陈设', level: 0 },
        { code: 'VEHICLE', label: '交通工具', level: 0 },
        { code: 'ARCHITECTURE', label: '建筑设施', level: 0 },
        { code: 'PLANT_NATURE', label: '植物与自然物', level: 0 },
        { code: 'CELESTIAL', label: '天象', level: 0 },
        { code: 'ORNAMENT', label: '装饰纹样', level: 0 },
        { code: 'INSCRIPTION', label: '文字题记', level: 0 }
      ],
      entityCategories: [
        ['HUMAN', '人物'], ['ANIMAL', '真实动物'], ['SUPERNATURAL', '神异形象'], ['OBJECT', '器物'],
        ['FURNITURE', '家具陈设'], ['VEHICLE', '交通工具'], ['ARCHITECTURE', '建筑设施'],
        ['PLANT_NATURE', '植物与自然物'], ['CELESTIAL', '天象'], ['ORNAMENT', '装饰纹样'], ['INSCRIPTION', '文字题记']
      ],
      humanSubcategories: ['主人类', '侍从类', '官吏类', '武职类', '乐舞表演类', '劳作类', '宗教人物类', '历史人物类', '普通人物'],
      sceneCategories: ['人物生活', '宴饮饮食', '乐舞娱乐', '出行仪仗', '生产劳动', '狩猎', '礼仪宗教', '历史故事', '神话祥瑞', '天象生肖', '花鸟山水', '建筑陈设', '装饰图案', '其他'],
      sceneTree: [
        { code: 'SCENE_LIFE', label: '人物生活', children: [{ code: 'SCENE_LIFE_GENERAL', label: '人物生活（未细分）' }] },
        { code: 'SCENE_BANQUET', label: '宴饮饮食', children: ['宴饮', '备宴', '进酒', '奉茶', '庖厨', '仓储'].map((label, index) => ({ code: `SCENE_BANQUET_${index + 1}`, label })) },
        { code: 'SCENE_PERFORMANCE', label: '乐舞娱乐', children: ['奏乐', '舞蹈', '百戏', '赏画', '听琴', '博弈'].map((label, index) => ({ code: `SCENE_PERFORMANCE_${index + 1}`, label })) },
        { code: 'SCENE_PRODUCTION', label: '生产劳动', children: ['农耕', '播种', '放牧', '汲水', '舂米'].map((label, index) => ({ code: `SCENE_PRODUCTION_${index + 1}`, label })) },
        { code: 'SCENE_PROCESSION', label: '出行仪仗', children: ['出行', '仪仗'].map((label, index) => ({ code: `SCENE_PROCESSION_${index + 1}`, label })) },
        { code: 'SCENE_HUNTING', label: '狩猎', children: [{ code: 'SCENE_HUNTING_GENERAL', label: '狩猎（未细分）' }] },
        { code: 'SCENE_RITUAL', label: '礼仪宗教', children: [{ code: 'SCENE_RITUAL_GENERAL', label: '礼仪宗教（未细分）' }] },
        { code: 'SCENE_HISTORY', label: '历史故事', children: [{ code: 'SCENE_HISTORY_GENERAL', label: '历史故事（未细分）' }] },
        { code: 'SCENE_MYTH', label: '神话祥瑞', children: [{ code: 'SCENE_MYTH_GENERAL', label: '神话祥瑞（未细分）' }] },
        { code: 'SCENE_CELESTIAL', label: '天象生肖', children: [{ code: 'SCENE_CELESTIAL_GENERAL', label: '天象生肖（未细分）' }] },
        { code: 'SCENE_NATURE', label: '花鸟山水', children: [{ code: 'SCENE_NATURE_GENERAL', label: '花鸟山水（未细分）' }] },
        { code: 'SCENE_ARCHITECTURE', label: '建筑陈设', children: [{ code: 'SCENE_ARCHITECTURE_GENERAL', label: '建筑陈设（未细分）' }] },
        { code: 'SCENE_ORNAMENT', label: '装饰图案', children: [{ code: 'SCENE_ORNAMENT_GENERAL', label: '装饰图案（未细分）' }] },
        { code: 'SCENE_OTHER', label: '其他', children: [{ code: 'SCENE_OTHER_GENERAL', label: '其他（未细分）' }] }
      ],
      entityTree: [
        { code: 'HUMAN', label: '人物', children: [
          { code: 'HUMAN_OWNER', label: '主人类', children: [{ code: 'TOMB_OWNER', label: '墓主人' }, { code: 'LADY', label: '夫人' }, { code: 'OWNER_GENERIC', label: '主人（未细分）' }] },
          { code: 'HUMAN_ATTENDANT', label: '侍从类', children: ['侍女', '男侍', '侍者', '仆人', '奴婢', '僮仆'].map((label, index) => ({ code: `ATTENDANT_${index + 1}`, label })) },
          { code: 'HUMAN_OFFICIAL', label: '官吏类', children: [{ code: 'OFFICIAL_GENERIC', label: '官吏（未细分）' }] },
          { code: 'HUMAN_MILITARY', label: '武职类', children: [{ code: 'MILITARY_GENERIC', label: '武职人物（未细分）' }] },
          { code: 'HUMAN_PERFORMER', label: '乐舞表演类', children: [{ code: 'PERFORMER_GENERIC', label: '乐舞表演者（未细分）' }] },
          { code: 'HUMAN_LABOR', label: '劳作类', children: [{ code: 'LABOR_GENERIC', label: '劳作人物（未细分）' }] },
          { code: 'HUMAN_RELIGIOUS', label: '宗教人物类', children: [{ code: 'RELIGIOUS_GENERIC', label: '宗教人物（未细分）' }] },
          { code: 'HUMAN_HISTORICAL', label: '历史人物类', children: [{ code: 'HISTORICAL_GENERIC', label: '历史人物（未细分）' }] },
          { code: 'HUMAN_GENERIC', label: '普通人物', children: [{ code: 'GENERIC_PERSON', label: '普通人物（未细分）' }] }
        ] },
        { code: 'ANIMAL', label: '真实动物', children: [{ code: 'ANIMAL_GENERAL', label: '动物（未细分）', children: [{ code: 'ANIMAL_GENERIC', label: '动物（未细分）' }] }] },
        { code: 'SUPERNATURAL', label: '神异形象', children: [
          { code: 'FOUR_GODS', label: '四神类', children: ['青龙', '白虎', '朱雀', '玄武'].map((label, index) => ({ code: `FOUR_GODS_${index + 1}`, label })) },
          { code: 'MYTH_BEAST', label: '神兽类', children: [{ code: 'MYTH_BEAST_GENERIC', label: '神兽（未细分）' }] },
          { code: 'FEATHERED_HUMAN', label: '羽人', children: [{ code: 'FEATHERED_HUMAN_GENERIC', label: '羽人（未细分）' }] },
          { code: 'FUXI', label: '伏羲', children: [{ code: 'FUXI_GENERIC', label: '伏羲（未细分）' }] },
          { code: 'NUWA', label: '女娲', children: [{ code: 'NUWA_GENERIC', label: '女娲（未细分）' }] },
          { code: 'XIWANGMU', label: '西王母', children: [{ code: 'XIWANGMU_GENERIC', label: '西王母（未细分）' }] },
          { code: 'DONGFANGGONG', label: '东王公', children: [{ code: 'DONGFANGGONG_GENERIC', label: '东王公（未细分）' }] }
        ] },
        { code: 'OBJECT', label: '器物', children: [
          { code: 'OBJECT_VESSEL', label: '饮食器', children: [{ code: 'VESSEL_GENERIC', label: '饮食器（未细分）' }] },
          { code: 'OBJECT_INSTRUMENT', label: '乐器', children: ['琵琶', '横笛', '腰鼓', '大鼓', '箜篌', '阮咸', '拍板'].map((label, index) => ({ code: `INSTRUMENT_${index + 1}`, label })) },
          { code: 'OBJECT_WEAPON', label: '武器', children: [{ code: 'WEAPON_GENERIC', label: '武器（未细分）' }] },
          { code: 'OBJECT_PARADE', label: '仪仗器', children: [{ code: 'PARADE_GENERIC', label: '仪仗器（未细分）' }] },
          { code: 'OBJECT_FARM', label: '农具', children: [{ code: 'FARM_GENERIC', label: '农具（未细分）' }] },
          { code: 'OBJECT_KITCHEN', label: '厨具', children: [{ code: 'KITCHEN_GENERIC', label: '厨具（未细分）' }] },
          { code: 'OBJECT_STUDY', label: '文房用品', children: [{ code: 'STUDY_GENERIC', label: '文房用品（未细分）' }] },
          { code: 'OBJECT_DAILY', label: '生活用品', children: [{ code: 'DAILY_GENERIC', label: '生活用品（未细分）' }] },
          { code: 'OBJECT_FOOD', label: '食物', children: [{ code: 'FOOD_GENERIC', label: '食物（未细分）' }] },
          { code: 'OBJECT_OTHER', label: '其他器物', children: [{ code: 'OBJECT_OTHER_GENERIC', label: '其他器物（未细分）' }] }
        ] },
        { code: 'FURNITURE', label: '家具陈设', children: [{ code: 'FURNITURE_GENERAL', label: '家具（未细分）', children: [{ code: 'FURNITURE_GENERIC', label: '家具（未细分）' }] }] },
        { code: 'VEHICLE', label: '交通工具', children: [{ code: 'VEHICLE_GENERAL', label: '交通工具（未细分）', children: [{ code: 'VEHICLE_GENERIC', label: '交通工具（未细分）' }] }] },
        { code: 'ARCHITECTURE', label: '建筑设施', children: [{ code: 'ARCHITECTURE_GENERAL', label: '建筑设施（未细分）', children: [{ code: 'ARCHITECTURE_GENERIC', label: '建筑设施（未细分）' }] }] },
        { code: 'PLANT_NATURE', label: '植物与自然物', children: [{ code: 'PLANT_GENERAL', label: '植物与自然物（未细分）', children: [{ code: 'PLANT_GENERIC', label: '植物与自然物（未细分）' }] }] },
        { code: 'CELESTIAL', label: '天象', children: [{ code: 'CELESTIAL_GENERAL', label: '天象（未细分）', children: [{ code: 'CELESTIAL_GENERIC', label: '天象（未细分）' }] }] },
        { code: 'ORNAMENT', label: '装饰纹样', children: [{ code: 'ORNAMENT_GENERAL', label: '装饰纹样（未细分）', children: [{ code: 'ORNAMENT_GENERIC', label: '装饰纹样（未细分）' }] }] },
        { code: 'INSCRIPTION', label: '文字题记', children: [{ code: 'INSCRIPTION_GENERAL', label: '文字题记（未细分）', children: [{ code: 'INSCRIPTION_GENERIC', label: '文字题记（未细分）' }] }] }
      ],
      relationFamilies: [
        { key: 'SPATIAL', label: '空间关系', count: 15, types: ['left_of', 'right_of', 'above', 'below', 'in_front_of', 'behind', 'beside', 'between', 'inside', 'contains', 'on', 'under', 'around', 'opposite_to', 'facing'] },
        { key: 'MEMBERSHIP', label: '成员与组成', count: 4, types: ['member_of', 'subgroup_of', 'part_of', 'located_in'] },
        { key: 'INTERACTION', label: '实体交互', count: 9, types: ['hold', 'carry', 'ride', 'lead', 'pull', 'use', 'play', 'sit_on', 'stand_on'] },
        { key: 'NARRATIVE', label: '叙事关系', count: 12, types: ['serve', 'attend', 'guard', 'follow', 'observe', 'listen_to', 'worship', 'guide', 'chase', 'accompany', 'command', 'assist'] },
        { key: 'TEXT', label: '文字关联', count: 3, types: ['identifies', 'labels', 'names'] }
      ],
      certainty: [
        { code: 'certain', label: '明确', expressions: '为、绘有、正在' },
        { code: 'probable', label: '较可能', expressions: '应为、似为、推测为' },
        { code: 'possible', label: '可能', expressions: '可能、或为' },
        { code: 'unknown', label: '无法确定', expressions: '不详、不清、漫漶' }
      ],
      visibility: ['clear', 'partial', 'occluded', 'damaged', 'unclear', 'missing'],
      viewTypes: ['full_scene', 'partial_view', 'detail', 'copy', 'reconstruction', 'unknown'],
      attributes: ['gender', 'age', 'hairstyle', 'headwear', 'face_feature', 'beard', 'upper_garment', 'lower_garment', 'footwear', 'accessory', 'garment_color', 'body_feature'],
      states: ['站立', '端坐', '盘腿而坐', '跪坐', '席地而坐', '匍匐', '俯身', '侧身', '正面', '昂首', '低头', '面向左', '面向右'],
      actions: ['拱手', '施礼', '指点', '行走', '奔跑', '舞蹈', '吹奏', '击鼓', '耕作', '播种', '汲水', '观赏', '交谈']
    },
    aiConfig: {
      summary: [
        { label: '当前生产版本', value: 'prod-2026-09' },
        { label: 'Taxonomy', value: 'v1.0-custom' },
        { label: '本周 AI 接受率', value: '71.4%' },
        { label: 'P95 单样本耗时', value: '18.2 s' }
      ],
      pipeline: [
        { code: 'S0', title: '预处理', description: '图片解码、hash、caption 规范化', model: 'preprocess-service', prompt: '—', enabled: true },
        { code: 'S1', title: 'Caption 解析', description: 'Scene / Entity / Group / Event / certainty', model: 'LLM-Parser-v4', prompt: 'caption-parse-v7', enabled: true },
        { code: 'S2', title: '视觉 Grounding', description: '文本实体 query → bbox / top-k', model: 'Grounding-Model-v2', prompt: 'grounding-query-v3', enabled: true },
        { code: 'S3', title: '遗漏实体发现', description: 'image-only 补充重要视觉对象', model: 'VLM-Discovery-v1', prompt: 'visual-discovery-v4', enabled: true },
        { code: 'S4', title: '属性/状态/动作', description: 'Entity-conditioned 多模态判断', model: 'Mural-VLM-v3', prompt: 'entity-facts-v5', enabled: true },
        { code: 'S5', title: 'Group / Event', description: '分组、事件与 Event Role 判定', model: 'LLM-Event-v2', prompt: 'event-parse-v2', enabled: true },
        { code: 'S6', title: 'Relation 抽取', description: 'SPATIAL / MEMBERSHIP / INTERACTION / NARRATIVE / TEXT 五族关系', model: 'Relation-Model-v3', prompt: 'relation-parse-v4', enabled: true },
        { code: 'S7', title: '质检与分级', description: '执行 14 条 QC，写入 certainty 与 visibility', model: 'qc-rules-v2', prompt: '—', enabled: true }
      ]
    },
    qualityRules: [
      { code: 'VIEW_TYPE_MISSING', level: 'BLOCKING', description: 'view_type 缺失或不在统一词表中', timing: 'AI 落库前 / 提交前', enabled: true },
      { code: 'SCENE_MISSING', level: 'BLOCKING', description: 'Scene 场景标签缺失', timing: 'AI 落库前 / 提交前', enabled: true },
      { code: 'REGION_STRUCTURE_INVALID', level: 'WARNING', description: '存在明显上下分栏但未建立 Region', timing: 'S1 / 审核', enabled: true },
      { code: 'ENTITY_MAIN_MISSING', level: 'BLOCKING', description: 'caption 中的主要对象未实体化', timing: 'S2–S3 / 审核', enabled: true },
      { code: 'CLOTHING_AS_ENTITY', level: 'WARNING', description: '衣服、冠帽、鞋履等被错误标为实体', timing: 'S2 / 审核', enabled: true },
      { code: 'IMPORTANT_OBJECT_MISSING', level: 'WARNING', description: '重要器物、家具或建筑遗漏', timing: 'S3 / 审核', enabled: true },
      { code: 'BBOX_INVALID', level: 'BLOCKING', description: 'BBox 缺失、越界或无法对应目标对象', timing: 'S2 / 提交前', enabled: true },
      { code: 'ATTRIBUTE_STATE_ACTION_MIXED', level: 'WARNING', description: 'Attribute、State、Action 语义混淆', timing: 'S4 / 审核', enabled: true },
      { code: 'ACTION_RELATION_MISSING', level: 'WARNING', description: '有明确客体的动作未建立关系', timing: 'S6 / 审核', enabled: true },
      { code: 'GROUP_MISSING', level: 'WARNING', description: '多人或多对象被整体描述但未建立 Group', timing: 'S5 / 审核', enabled: true },
      { code: 'EVENT_MISSING', level: 'WARNING', description: '多角色活动未建立 Event 或 Event Role', timing: 'S5 / 审核', enabled: true },
      { code: 'COUNT_MISMATCH', level: 'WARNING', description: 'count_text 与 count_grounded 不一致', timing: 'S3 / 审核', enabled: true },
      { code: 'CERTAINTY_OVERSTATED', level: 'BLOCKING', description: '“似为、应为、可能”被错误标为 certain', timing: 'S4 / 提交前', enabled: true },
      { code: 'SPECIAL_INFO_MISSING', level: 'WARNING', description: '残损 visibility、题记或专家解释未分类保存', timing: 'S7 / 提交前', enabled: true }
    ],
    users: [
      { name: '项目管理员', username: 'admin_01', role: '管理员', roleId: 'admin', status: 'active', tasks: 0 },
      { name: '审核员一', username: 'reviewer_01', role: '标注审核员', roleId: 'reviewer', status: 'active', tasks: 2 },
      { name: '审核员二', username: 'reviewer_02', role: '标注审核员', roleId: 'reviewer', status: 'active', tasks: 2 },
      { name: '审核员三', username: 'reviewer_03', role: '标注审核员', roleId: 'reviewer', status: 'active', tasks: 0 },
      { name: '专家一', username: 'expert_01', role: '专家审核员', roleId: 'expert', status: 'active', tasks: 3 },
      { name: '专家二', username: 'expert_02', role: '专家审核员', roleId: 'expert', status: 'active', tasks: 1 },
      { name: '研究用户', username: 'researcher_01', role: '只读研究员', roleId: 'researcher', status: 'active', tasks: 0 }
    ],
    audit: {
      version: 'S-0002315',
      versions: [
        { id: 'raw-v1', stage: 'raw', label: 'raw rev1', operator: 'system', time: '13:02', status: '历史版本', note: 'image + caption', locked: true },
        { id: 'candidate-v1', stage: 'ai_candidate', label: 'candidate v1', operator: 'run_001', time: '13:05', status: '历史版本', note: 'S0–S7 初始结果', locked: true },
        { id: 'reviewed-v1', stage: 'reviewer', label: 'reviewed v1', operator: 'reviewer_01', time: '13:48', status: '可回滚', note: '修改 BBox、类别与关系 4 项', locked: false },
        { id: 'candidate-v2', stage: 'ai_candidate', label: 'candidate v2', operator: 'run_014', time: '14:11', status: '历史版本', note: '按审核意见重新运行 AI', locked: true },
        { id: 'approved-v1', stage: 'admin_approved', label: 'approved v1', operator: 'admin_01', time: '14:36', status: '当前 Gold', note: '专家复核通过并验收入库', locked: true }
      ],
      diff: [
        { field: 'entity.E1.bbox', before: '[160, 82, 248, 334]', after: '[158, 82, 246, 334]' },
        { field: 'entity.E2.fine_category', before: '侍女', after: '侍女', certainty: 'certain' },
        { field: 'relation.R2', before: 'P2 hold O1', after: 'P2 hold O1', certainty: 'certain' },
        { field: 'entity.E2.visibility', before: 'partial', after: 'clear' }
      ],
      lineage: [
        { time: '13:02', title: 'raw rev1', detail: 'image + caption', tone: 'blue' },
        { time: '13:05', title: 'candidate v1', detail: 'run_001 · S0–S7', tone: 'blue' },
        { time: '13:48', title: 'reviewed v1', detail: '修改 4 项，补充 1 个关系', tone: 'blue' },
        { time: '14:11', title: 'candidate v2', detail: 'AI 按审核意见重跑', tone: 'blue' },
        { time: '14:36', title: 'approved v1', detail: 'admin_01 验收入库', tone: 'blue' }
      ],
      logs: [
        { actor: 'reviewer_01', action: 'EDIT', field: 'E1.bbox', change: '[160, 82, 248, 334] → [158, 82, 246, 334]' },
        { actor: 'reviewer_01', action: 'EDIT', field: 'E2.visibility', change: 'partial → clear' },
        { actor: 'expert_02', action: 'APPROVE', field: 'certainty', change: 'probable → certain' },
        { actor: 'admin_01', action: 'EXPORT', field: 'gold', change: 'approved v1' }
      ]
    },
    exports: [
      { id: 'gold', title: 'Gold', description: '仅 Approved 版本。', available: true },
      { id: 'reviewed', title: 'Reviewed Train', description: '人工审核完成数据。', available: true },
      { id: 'ai-pseudo', title: 'AI Pseudo', description: '仅 Candidate，用于伪标签实验。', available: true },
      { id: 'feedback', title: 'Feedback', description: 'AI 原值 + 人工后值 + action。', available: true }
    ],
    annotationEditor: {
      viewType: 'full_scene',
      scene: { level1: 'SCENE_BANQUET', level2: 'SCENE_BANQUET_5', themes: '宴饮、庖厨', certainty: 'certain', evidence: 'caption_explicit' },
      regions: [{ id: 'R1', type: '上部宴饮区', bbox: [0, 0, 1000, 520] }, { id: 'R2', type: '下部庖厨区', bbox: [0, 520, 1000, 1000] }],
      events: [{ id: 'EV1', family: '日常宴饮', type: '宴饮', participants: 'G1 = host；G2 = attendant', certainty: 'certain' }],
      groups: [{ id: 'G1', type: '主从人物组', count: 2, countType: 'exact', members: 'E1, E2', sharedStates: '端坐 / 站立' }],
      entities: [
        { id: 'E1', baseCategory: 'HUMAN', subCategory: 'HUMAN_OWNER', fineCategory: 'TOMB_OWNER', normalizedValue: '墓主人', certainty: 'certain', evidence: 'caption_explicit', bbox: [82, 150, 360, 860], attributes: 'gender=男；headwear=尖山小冠', states: '端坐', actions: '', visibility: 'clear' },
        { id: 'E2', baseCategory: 'HUMAN', subCategory: 'HUMAN_ATTENDANT', fineCategory: 'ATTENDANT_1', normalizedValue: '侍女', certainty: 'certain', evidence: 'caption_explicit', bbox: [560, 120, 870, 840], attributes: 'gender=女；upper_garment=长裙', states: '站立', actions: '侍奉', visibility: 'partial' }
      ],
      relations: [
        { id: 'REL1', family: 'SPATIAL', type: 'beside', source: 'E2', target: 'E1', certainty: 'certain', evidence: 'visual + caption' },
        { id: 'REL2', family: 'NARRATIVE', type: 'serve', source: 'E2', target: 'E1', certainty: 'probable', evidence: 'caption_explicit' }
      ]
    },
    workbench: {
      reviewer: {
        title: '标注审核工作台',
        description: '处理已分配样本，完成 BBox、类别、关系与确定性分级校正。',
        stats: [
          { label: '待审核', value: '2', hint: '任务内样本', tone: 'blue' },
          { label: '今日已完成', value: '6', hint: '较昨日 +2', tone: 'green' },
          { label: '平均处理时长', value: '8.4m', hint: '近 7 天', tone: 'gray' }
        ],
        queueTitle: '当前审核队列',
        queue: samples.slice(0, 2).map((sample, index) => ({ id: sample.id, title: sample.title, status: index === 0 ? 'IN_REVIEW' : 'PENDING', tag: sample.risk >= 75 ? '高风险' : '普通', updated: `剩余 ${index === 0 ? 2 : 6} 小时`, caption: sample.caption }))
      },
      expert: {
        title: '专家复核工作台',
        description: '复核专业身份、复杂叙事、不确定术语与跨模态冲突。',
        stats: [
          { label: '待复核', value: '3', hint: '跨任务统计', tone: 'blue' },
          { label: '今日已完成', value: '4', hint: '通过率 100%', tone: 'green' },
          { label: '平均处理时长', value: '12.6m', hint: '近 7 天', tone: 'gray' }
        ],
        queueTitle: '专家复核队列',
        queue: samples.slice(2, 5).map((sample, index) => ({ id: sample.id, title: sample.title, status: 'EXPERT_REVIEW', tag: index === 0 ? '复杂叙事' : '关系存疑', updated: `优先级：${index === 0 ? '高' : '普通'}`, caption: sample.caption }))
      }
    },
    tasks: {
      reviewer: [
        { id: 'TASK-20261008-01', name: '人物图标注审核', samples: 2, priority: '高', deadline: '2026-10-08 18:00', progress: 0, status: '进行中' },
        { id: 'TASK-20261007-06', name: '乐舞图标注审核', samples: 5, priority: '普通', deadline: '2026-10-09 12:00', progress: 60, status: '进行中' },
        { id: 'TASK-20261006-03', name: '仪仗队列抽检', samples: 8, priority: '普通', deadline: '已完成', progress: 100, status: '已完成' }
      ],
      expert: [
        { id: 'EX-20261008-02', name: '宴饮图专家复核', samples: 3, priority: '高', deadline: '2026-10-08 20:00', progress: 33, status: '进行中' },
        { id: 'EX-20261007-04', name: '出行图关系复核', samples: 6, priority: '普通', deadline: '2026-10-09 16:00', progress: 50, status: '进行中' }
      ]
    },
    records: [
      { time: '2026-10-08 14:36', sample: 'MURAL-02313', action: 'ACCEPT', role: 'expert_01', result: '通过', detail: '确认身份为仪仗人物' },
      { time: '2026-10-08 13:48', sample: 'MURAL-02315', action: 'EDIT', role: 'reviewer_01', result: '提交', detail: '修改 BBox 与 headwear 类别' },
      { time: '2026-10-07 18:12', sample: 'MURAL-02308', action: 'ACCEPT', role: 'reviewer_01', result: '完成', detail: '确认朱雀实体及空间关系' },
      { time: '2026-10-07 16:40', sample: 'MURAL-02307', action: 'REJECT', role: 'expert_01', result: '退回', detail: '庖厨人物关系需重新标注' }
    ]
  };
})();









