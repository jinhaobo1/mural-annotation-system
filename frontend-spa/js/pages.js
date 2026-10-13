/** 页面渲染器。所有页面只返回 HTML，交互由 app.js 统一委托处理。 */
(function () {
  const Data = window.MockData;
  const UI = window.UI;
  const Permission = window.PermissionConfig;
  const state = () => window.AppState;

  const canWrite = () => state().role === 'admin';
  const action = (label, routeKey, iconName) => UI.button(label, { route: routeKey, icon: iconName, variant: 'secondary' });
  const primary = (label, actionName, iconName) => UI.button(label, { action: actionName, icon: iconName, variant: 'primary' });
  const readOnlyNotice = () => '<div class="notice-bar"><span class="notice-dot"></span>当前身份为只读研究员，可浏览但不能修改、分配或导出数据。</div>';

  function sectionTitle(title, subtitle, extra) {
    return `<div class="section-head"><div><h2>${UI.escapeHtml(title)}</h2>${subtitle ? `<p>${UI.escapeHtml(subtitle)}</p>` : ''}</div>${extra || ''}</div>`;
  }

  function tableShell(head, rows, className) {
    const bodyRows = Array.isArray(rows) ? rows.join('') : rows;
    return `<div class="table-shell ${className || ''}"><table><thead><tr>${head.map((item) => `<th>${item}</th>`).join('')}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  }

  function renderOverview() {
    const overview = Data.overview;
    const actions = canWrite()
      ? `${action('分配任务', 'assignment', 'assignment')}${primary('批量 AI 标注', 'bulk-ai', 'play')}`
      : UI.button('只读模式', { variant: 'secondary', icon: 'lock', disabled: true });
    const alerts = overview.alerts.map((alert) => `
      <div class="alert-row alert-${alert.tone}">
        <span class="alert-mark">${alert.tone === 'danger' ? '!' : alert.tone === 'warning' ? '!' : 'i'}</span>
        <div><strong>${UI.escapeHtml(alert.title)}</strong><p>${UI.escapeHtml(alert.detail)}</p></div>
        <button class="link-button" data-action="toast" data-message="${UI.escapeHtml(alert.action)}功能已预留">${UI.escapeHtml(alert.action)}</button>
      </div>`).join('');
    const recent = overview.recent.map((item) => `
      <tr><td><strong>${UI.escapeHtml(item.id)}</strong><small>${UI.escapeHtml(item.title)}</small></td><td>${UI.statusBadge(item.status)}</td><td>${UI.escapeHtml(item.owner)}</td><td>${UI.escapeHtml(item.updated)}</td></tr>`).join('');
    return `
      ${UI.pageHeader('项目管理首页', '管理员负责数据、AI 任务、任务分配、工作流和最终验收入库。', actions)}
      <section class="stat-grid">${overview.stats.map(UI.statCard).join('')}</section>
      <section class="card funnel-card">${sectionTitle('工作流漏斗', '从 AI Candidate 到管理员验收入库')}<div class="funnel-grid">${overview.funnel.map((item, index) => `<div class="funnel-item"><span>${index + 1}</span><small>${item.label}</small><strong>${item.value}</strong></div>`).join('')}</div></section>
      <div class="content-grid content-grid-2">
        <section class="card">${sectionTitle('项目动态', '最近入库与状态变化')}${tableShell(['样本', '状态', '负责人', '更新时间'], recent.length ? recent : ['<tr><td colspan="4">暂无数据</td></tr>'])}</section>
        <section class="card">${sectionTitle('待处理提醒', '阻断项与高风险样本优先处理')}<div class="alert-list">${alerts}</div></section>
      </div>`;
  }

  function renderSamples() {
    const rows = Data.samples.map((sample) => `
      <tr>
        <td><input type="checkbox" ${canWrite() ? '' : 'disabled'} aria-label="选择 ${sample.id}"></td>
        <td>${UI.muralThumb(sample)}</td>
        <td><strong>${UI.escapeHtml(sample.id)} · ${UI.escapeHtml(sample.title)}</strong><small>${UI.escapeHtml(sample.caption)}</small></td>
        <td>${UI.statusBadge(sample.status)}</td>
        <td>${sample.risk == null ? '—' : `<span class="risk-score ${sample.risk >= 75 ? 'high' : sample.risk >= 55 ? 'medium' : 'low'}">${sample.risk} / 100</span>`}</td>
        <td>${UI.escapeHtml(sample.version)}</td>
        <td class="row-actions"><button class="btn btn-secondary btn-sm" data-action="toast" data-message="正在打开 ${sample.id} 详情">详情</button>${canWrite() && sample.status === 'AI_READY' ? '<button class="btn btn-secondary btn-sm" data-action="toast" data-message="已重新提交 AI 标注任务">重新运行 AI</button>' : ''}</td>
      </tr>`).join('');
    return `
      ${UI.pageHeader('样本管理', '每条样本至少包含图片和 caption，支持单张 AI、批量 AI、进入审核和查看版本。', canWrite() ? `${UI.button('导入数据', { action: 'toast', icon: 'upload' })}${primary('批量 AI 自动标注', 'bulk-ai', 'play')}` : UI.button('只读模式', { variant: 'secondary', icon: 'lock', disabled: true }))}
      ${!canWrite() ? readOnlyNotice() : ''}
      <section class="card"><div class="filter-bar"><label class="search-box">${UI.icon('search')}<input placeholder="搜索标题 / caption / 样本 ID" /></label><select><option>全部状态</option><option>AI_READY</option><option>APPROVED</option></select><select><option>全部视图类型</option><option>人物画</option><option>乐舞图</option></select><button class="btn btn-secondary" data-action="toast" data-message="筛选条件已重置">重置</button></div>${tableShell(['选择', '图像', '壁画 ID / 名称', '状态', 'AI 风险', '版本', '操作'], rows)}</section>`;
  }

  function renderAssignment() {
    if (!canWrite()) return UI.emptyState('无任务分配权限', '仅管理员可以创建并分配任务。');
    const rows = Data.assignment.readySamples.map((sample, index) => `<tr><td><input type="checkbox" ${index < 2 ? 'checked' : ''}></td><td><strong>${UI.escapeHtml(sample.id)}</strong><small>${UI.escapeHtml(sample.title)}</small></td><td>${UI.escapeHtml(sample.caption)}</td><td><span class="risk-score ${sample.risk >= 75 ? 'high' : 'medium'}">${sample.risk}</span></td><td>${UI.statusBadge(sample.status)}</td></tr>`).join('');
    return `
      ${UI.pageHeader('任务分配', '从 AI 完成的壁画中勾选需要分配的样本，再指定审核员和专家审核员。', UI.button('查看工作流', { route: 'workflow', icon: 'workflow' }))}
      <div class="assignment-layout"><section class="card">${sectionTitle('选择壁画', '当前仅显示 AI_READY 样本', UI.badge('仅显示 AI_READY', 'ai-ready'))}<div class="filter-bar compact"><label class="search-box">${UI.icon('search')}<input placeholder="搜索壁画 ID / 名称 / Caption" /></label><select><option>全部风险</option><option>高风险优先</option></select><button class="btn btn-secondary" data-action="toast" data-message="已清空选择">清空选择</button></div>${tableShell(['选择', '壁画', 'Caption 摘要', 'AI 风险', '状态'], rows)}</section>
      <aside class="card assignment-panel">${sectionTitle('分配设置', '审核员提交后自动流转到指定专家')}<label class="field"><span>任务名称 *</span><input value="AI 标注结果审核" /></label><label class="field"><span>审核员 *</span><select>${Data.assignment.reviewers.map((item) => `<option>${UI.escapeHtml(item)}</option>`).join('')}</select></label><label class="field"><span>专家审核员 *</span><select>${Data.assignment.experts.map((item) => `<option>${UI.escapeHtml(item)}</option>`).join('')}</select></label><div class="field-row"><label class="field"><span>优先级</span><select><option>普通</option><option>高</option></select></label><label class="field"><span>截止日期</span><input type="date" value="2026-10-15" /></label></div><div class="summary-lines"><div><span>选择数量</span><strong>2 幅</strong></div><div><span>任务流转</span><strong>审核员 → 专家 → 管理员</strong></div></div>${primary('创建并分配任务', 'create-assignment', 'check')}</aside></div>`;
  }

  function renderAiTasks() {
    const rows = Data.aiTasks.map((task) => `<tr><td><strong>${UI.escapeHtml(task.id)}</strong><small>${UI.escapeHtml(task.updated)}</small></td><td>${UI.escapeHtml(task.type)}</td><td>${UI.escapeHtml(task.scope)}</td><td>${UI.statusBadge(task.status)}</td><td>${UI.progress(task.progress, task.progressText)}</td><td>${task.errors || '—'}</td><td><button class="btn btn-secondary btn-sm" data-action="toast" data-message="正在查看 ${task.id} 任务详情">详情</button></td></tr>`).join('');
    return `${UI.pageHeader('AI 任务中心', '监控单张 Run 和批量 Batch；前端不直接调用模型供应商。', `${UI.button('单张 AI', { action: 'toast', icon: 'upload' })}${primary('创建批量任务', 'bulk-ai', 'play')}`)}<section class="mini-stat-grid"><article><span>运行中任务</span><strong>1</strong></article><article><span>今日完成</span><strong>2</strong></article><article><span>错误条目</span><strong>3</strong></article></section><section class="card">${sectionTitle('任务队列', '每隔 5 秒自动刷新状态')}${tableShell(['任务', '类型', '范围', '状态', '进度', '错误', '操作'], rows)}</section>`;
  }

  function renderWorkflow() {
    const lifecycle = Data.workflow.lifecycle.map((step, index) => `<div class="lifecycle-step"><span>${index + 1}</span><strong>${UI.escapeHtml(step)}</strong></div>`).join('');
    const stages = Data.workflow.stages.map((stage, index) => `<div class="flow-stage flow-${stage.tone}"><small>${stage.stage}</small><strong>${UI.escapeHtml(stage.title)}</strong>${index < Data.workflow.stages.length - 1 ? '<i>→</i>' : ''}</div>`).join('');
    const duties = Data.workflow.duties.map((item) => `<div class="duty-row"><strong>${UI.escapeHtml(item.title)}</strong><p>${UI.escapeHtml(item.description)}</p></div>`).join('');
    const rules = Data.workflow.rules.map((rule, index) => `<div class="switch-row"><div><strong>${UI.escapeHtml(rule.title)}</strong><p>${UI.escapeHtml(rule.description)}</p></div><label class="switch"><input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle-workflow" data-index="${index}"><span></span></label></div>`).join('');
    return `${UI.pageHeader('标注工作流', '配置 S0–S7 自动标注、审核、专家复核和最终验收的流转规则，并同步教程 8.1 自检要求。', primary('保存工作流', 'save-workflow', 'save'))}<section class="card">${sectionTitle('数据状态流转', '版本不可变，每次修正产生新版本')}<div class="lifecycle-line">${lifecycle}</div></section><section class="card workflow-pipeline-card">${sectionTitle('AI 标注流水线', '从预处理到关系抽取和质检分级')}<div class="flow-line">${stages}</div></section><div class="content-grid content-grid-2 workflow-grid"><section class="card">${sectionTitle('阶段职责')}${duties}</section><section class="card">${sectionTitle('流转规则')}${rules}<div class="status-map"><label class="field"><span>审核员提交后状态</span><select><option>EXPERT_REVIEW</option></select></label><label class="field"><span>专家通过后状态</span><select><option>ADMIN_ACCEPTANCE</option></select></label><label class="field"><span>管理员验收后状态</span><select><option>APPROVED</option></select></label></div></section></div>`;
  }

  function renderTaxonomy() {
    const treeNodes = Data.taxonomy.entityTree.flatMap((top) => [{ ...top, level: 0 }, ...top.children.flatMap((sub) => [{ ...sub, level: 1 }, ...sub.children.map((fine) => ({ ...fine, level: 2 }))])]);
    const tree = treeNodes.map((node) => `<button class="tree-node level-${node.level}" data-action="select-taxonomy" data-code="${node.code}"><span>${node.level ? '└' : '⌄'}</span><strong>${UI.escapeHtml(node.code)}</strong><em>${UI.escapeHtml(node.label)}</em></button>`).join('');
    const categories = Data.taxonomy.entityCategories.map(([code, label]) => `<option>${code} / ${label}</option>`).join('');
    const relationFamilies = Data.taxonomy.relationFamilies.map((family) => `<article class="relation-family"><div><strong>${family.key}</strong><p>${family.label} · ${family.count} 类</p></div><div class="type-pills">${family.types.map((type) => `<span>${UI.escapeHtml(type)}</span>`).join('')}</div></article>`).join('');
    const certaintyRows = Data.taxonomy.certainty.map((item) => `<tr><td><code>${item.code}</code></td><td>${item.label}</td><td>${item.expressions}</td></tr>`).join('');
    const visibilityRows = Data.taxonomy.visibility.map((item) => `<tr><td><code>${item}</code></td><td>${item === 'clear' ? '清晰' : item === 'partial' ? '局部可见' : item === 'occluded' ? '被遮挡' : item === 'damaged' ? '残损' : item === 'unclear' ? '不清晰' : '缺失'}</td></tr>`).join('');
    const customTags = state().customTags || { attributes: [], states: [], actions: [], relations: [] };
    const customTagGroups = ['attributes', 'states', 'actions', 'relations'].map((kind) => {
      const chips = (customTags[kind] || []).map((tag) => `<button class="custom-tag-chip" data-action="remove-custom-tag" data-kind="${kind}" data-value="${UI.escapeHtml(tag)}">${UI.escapeHtml(tag)} ×</button>`).join('');
      return `<div><strong>${kind}</strong><div>${chips || '<small>暂无自定义标签</small>'}</div></div>`;
    }).join('');
    const customTagCard = `<section class="card custom-tag-manager">${sectionTitle('人工添加标签', '新增后立即出现在工作台标签选择和关系类型中', canWrite() ? primary('+ 新增标签', 'add-taxonomy-tag', 'plus') : UI.badge('只读', 'warning'))}<div class="custom-tag-form"><label class="field"><span>标签类型</span><select id="taxonomy-tag-kind"><option value="attributes">Attribute 属性</option><option value="states">State 状态</option><option value="actions">Action 动作</option><option value="relations">Relation 关系</option></select></label><label class="field"><span>标签名称</span><input id="taxonomy-tag-input" placeholder="例如：身份、持扇、面向右" /></label></div><div class="custom-tag-groups">${customTagGroups}</div></section>`;
    return `${UI.pageHeader('自定义标注体系', '按教程维护五层结构、11 个一级实体类别、14 个一级场景、5 大关系族及 Attribute / State / Action。', `${UI.button('导出 JSON', { action: 'export-json', icon: 'download' })}${UI.button('导入体系', { action: 'toast', icon: 'upload' })}${primary('发布新版本', 'publish-taxonomy', 'check')}`)}${!canWrite() ? readOnlyNotice() : ''}<section class="mini-stat-grid taxonomy-stats">${Data.taxonomy.stats.map((item) => `<article><span>${UI.escapeHtml(item.label)}</span><strong>${UI.escapeHtml(item.value)}</strong></article>`).join('')}</section><div class="tabs">${Data.taxonomy.tabs.map((tab, index) => `<button class="${index === 0 ? 'active' : ''}" data-action="toast" data-message="已切换到${tab}">${UI.escapeHtml(tab)}</button>`).join('')}</div><div class="taxonomy-layout"><section class="card">${sectionTitle('实体分类与场景体系', 'HUMAN 二级 9 类；Scene 一级 14 类', UI.button('+ 新增类别', { action: 'toast', icon: 'plus', className: 'btn-sm', variant: 'primary' }))}<div class="tree-list">${tree}</div><div class="scene-tags"><strong>Scene 一级类别</strong><div>${Data.taxonomy.sceneCategories.map((item) => `<span>${UI.escapeHtml(item)}</span>`).join('')}</div></div></section><section class="card editor-card">${sectionTitle('五层标注字段', '实体遵循 Category + Location + Attribute + State + Action')}<div class="form-grid"><label class="field"><span>一级类别 base_category</span><select>${categories}</select></label><label class="field"><span>二级类别 sub_category</span><select>${Data.taxonomy.humanSubcategories.map((item) => `<option>${UI.escapeHtml(item)}</option>`).join('')}</select></label><label class="field"><span>三级细类 raw_value</span><input value="侍女" /></label><label class="field"><span>normalized_value</span><input value="侍女" /></label><label class="field"><span>certainty</span><select>${Data.taxonomy.certainty.map((item) => `<option value="${item.code}">${item.code} · ${item.label}</option>`).join('')}</select></label><label class="field"><span>visibility</span><select>${Data.taxonomy.visibility.map((item) => `<option>${item}</option>`).join('')}</select></label></div><label class="field"><span>evidence</span><input value='["caption_explicit", "visual_grounded"]' /></label><div class="editor-actions">${UI.button('停用标签', { action: 'toast', variant: 'danger' })}${primary('保存字段', 'save-taxonomy', 'save')}</div></section></div>${customTagCard}<section class="card">${sectionTitle('关系族与 43 个关系类型', '空间 15、成员 4、交互 9、叙事 12、文字 3')}<div class="relation-family-grid">${relationFamilies}</div></section><div class="content-grid content-grid-2 taxonomy-reference"><section class="card">${sectionTitle('Certainty 四级', '确定性必须绑定具体事实')}${tableShell(['代码', '含义', '常见表达'], certaintyRows)}</section><section class="card">${sectionTitle('Visibility 六级', '残损不等于分类不确定')}${tableShell(['代码', '含义'], visibilityRows)}</section></div>`;
  }

  function renderAiConfig() {
    const pipeline = Data.aiConfig.pipeline.map((stage, index) => `<button class="pipeline-item ${index === 1 ? 'active' : ''}" data-action="select-stage" data-stage="${stage.code}"><span class="stage-code">${stage.code}</span><div><strong>${UI.escapeHtml(stage.title)}</strong><small>${UI.escapeHtml(stage.description)}</small><p><em>${UI.escapeHtml(stage.model)}</em><em>${UI.escapeHtml(stage.prompt)}</em>${UI.badge(stage.enabled ? 'enabled' : 'disabled', stage.enabled ? 'completed' : 'failed')}</p></div></button>`).join('');
    return `${UI.pageHeader('AI 配置管理', '以流水线方式管理 S0–S7；点击任一 Stage 可视化编辑模型、Prompt、阈值、超时和重试策略。', `${UI.button('复制为新配置', { action: 'toast' })}${UI.button('对比版本', { action: 'toast' })}${primary('发布配置', 'publish-ai-config', 'check')}`)}<section class="mini-stat-grid">${Data.aiConfig.summary.map((item) => `<article><span>${UI.escapeHtml(item.label)}</span><strong>${UI.escapeHtml(item.value)}</strong></article>`).join('')}</section><div class="config-layout"><section class="card">${sectionTitle('AI Pipeline', '生产环境配置', UI.badge('生产', 'completed'))}<div class="pipeline-list">${pipeline}</div></section><section class="card">${sectionTitle('S1 Caption 解析', '当前 Stage 配置', UI.button('测试当前 Stage', { action: 'test-stage', icon: 'play', className: 'btn-sm' }))}<div class="model-options"><label class="model-option active"><input type="radio" name="model" checked><strong>Internal LLM</strong><small>默认生产</small></label><label class="model-option"><input type="radio" name="model"><strong>Vision MLLM</strong><small>图文联合</small></label><label class="model-option"><input type="radio" name="model"><strong>External API</strong><small>需权限</small></label></div><label class="field"><span>model_id</span><input value="LLM-Parser-v4" /></label><label class="field"><span>Prompt 版本</span><div class="input-action"><select><option>caption-parse-v7</option><option>caption-parse-v6</option></select><button class="btn btn-secondary" data-action="toast" data-message="已打开 Prompt 编辑器">编辑 Prompt</button></div></label><label class="field"><span>置信度阈值 <b>0.72</b></span><input type="range" min="0" max="1" value="0.72" step="0.01" /></label><div class="field-row"><label class="field"><span>Timeout（秒）</span><input type="number" value="30" /></label><label class="field"><span>最大重试</span><input type="number" value="3" /></label></div><div class="switch-row borderless"><div><strong>启用该 Stage</strong><p>关闭后 Orchestrator 将跳过本阶段</p></div><label class="switch"><input type="checkbox" checked><span></span></label></div></section></div>`;
  }

  function renderQuality() {
    if (!canWrite()) return UI.emptyState('无质检规则权限', '仅管理员可以配置质检规则。');
    const blocking = Data.qualityRules.filter((rule) => rule.level === 'BLOCKING').length;
    const warning = Data.qualityRules.filter((rule) => rule.level === 'WARNING').length;
    const rows = Data.qualityRules.map((rule) => `<tr><td><code>${UI.escapeHtml(rule.code)}</code></td><td>${UI.badge(rule.level, rule.level)}</td><td>${UI.escapeHtml(rule.description)}</td><td>${UI.escapeHtml(rule.timing)}</td><td><label class="switch small"><input type="checkbox" ${rule.enabled ? 'checked' : ''} data-action="toggle-quality" data-code="${rule.code}"><span></span></label></td><td><button class="btn btn-secondary btn-sm" data-action="edit-rule" data-code="${rule.code}">编辑</button></td></tr>`).join('');
    return `${UI.pageHeader('质检规则', '按教程 8.1 自检清单建立 14 条规则，覆盖整体信息、实体、语义和特殊信息。', primary('+ 新增规则', 'add-rule', 'plus'))}<section class="mini-stat-grid"><article><span>规则总数</span><strong>${Data.qualityRules.length}</strong></article><article><span>BLOCKING</span><strong>${blocking}</strong></article><article><span>WARNING</span><strong>${warning}</strong></article><article><span>提交前执行</span><strong>${Data.qualityRules.filter((rule) => rule.timing.includes('提交前')).length}</strong></article></section><section class="card">${tableShell(['规则码', '级别', '检查内容', '执行时机', '启用', '操作'], rows)}</section>`;
  }

  function renderUsers() {
    if (!canWrite()) return UI.emptyState('无用户与角色权限', '仅管理员可以管理用户和角色权限。');
    const tab = state().userTab || 'users';
    const tabs = `<div class="tabs"><button class="${tab === 'users' ? 'active' : ''}" data-action="switch-user-tab" data-tab="users">用户管理</button><button class="${tab === 'roles' ? 'active' : ''}" data-action="switch-user-tab" data-tab="roles">角色管理</button></div>`;
    if (tab === 'roles') {
      const roles = Permission.getAllRoles();
      const routeKeys = Object.keys(Permission.routes).filter((key) => Permission.routes[key].nav);
      const cards = roles.map((role) => `<article class="role-card role-${role.tone}"><span class="role-badge">${role.badge}</span><div><strong>${role.label}</strong><p>${role.description}</p><small>${role.permissions.length} 个模块 · 主页：${Permission.routes[role.home].title}</small></div></article>`).join('');
      const matrix = routeKeys.map((key) => `<tr><td><strong>${Permission.routes[key].group}</strong><small>${Permission.routes[key].title}</small></td>${roles.map((role) => `<td><label class="check-box"><input type="checkbox" data-action="permission-toggle" data-role="${role.id}" data-route="${key}" ${role.permissions.includes(key) ? 'checked' : ''}><span></span></label></td>`).join('')}</tr>`).join('');
      return `${UI.pageHeader('用户与角色', '统一管理系统用户、角色以及角色权限；修改后导航栏会立即按权限重绘。', UI.button('恢复默认权限', { action: 'reset-permissions', variant: 'secondary' }))}${tabs}<section class="role-grid">${cards}</section><section class="card">${sectionTitle('角色权限矩阵', '勾选即授权该角色访问对应模块')}${tableShell(['模块', ...roles.map((role) => role.label)], matrix)}</section>`;
    }
    const rows = Data.users.map((user) => `<tr><td><span class="user-avatar avatar-${user.roleId}">${user.name.slice(0, 1)}</span><strong>${UI.escapeHtml(user.name)}</strong></td><td>${UI.escapeHtml(user.username)}</td><td>${UI.badge(user.role, user.roleId)}</td><td>${UI.statusBadge(user.status)}</td><td>${user.tasks}</td><td><button class="btn btn-secondary btn-sm" data-action="toast" data-message="正在编辑 ${user.name}">编辑</button><button class="btn btn-secondary btn-sm" data-action="toast" data-message="已切换 ${user.name} 的启用状态">停用</button></td></tr>`).join('');
    return `${UI.pageHeader('用户与角色', '统一管理系统用户、角色以及角色权限。', primary('+ 新增用户', 'add-user', 'plus'))}${tabs}<section class="card">${sectionTitle('用户管理')}<div class="filter-bar compact"><label class="search-box">${UI.icon('search')}<input placeholder="搜索用户名 / 姓名" /></label><select><option>全部角色</option></select><select><option>全部状态</option></select></div>${tableShell(['用户', '用户名', '角色', '状态', '当前任务', '操作'], rows)}</section>`;
  }

  function renderAudit() {
    const versionData = (state().versions && state().versions.length ? state().versions : Data.audit.versions).map((version, index) => ({ label: version.label || `v${version.version}`, note: version.note || '后端版本记录', stage: version.stage || 'version', operator: version.operator || version.editor || 'system', time: version.time || version.created_at || '', status: version.status || (index === 0 ? '当前版本' : '历史版本'), locked: version.locked === true, version: version.version }));
    const versions = versionData.map((version) => `<tr><td><strong>${UI.escapeHtml(version.label)}</strong><small>${UI.escapeHtml(version.note)}</small></td><td>${UI.badge(version.stage, version.stage === 'admin_approved' ? 'approved' : 'ai-ready')}</td><td>${UI.escapeHtml(version.operator)}</td><td>${UI.escapeHtml(version.time)}</td><td>${UI.escapeHtml(version.status)}</td><td><button class="btn btn-secondary btn-sm" data-action="compare-version">对比</button>${version.version && !version.locked ? `<button class="btn btn-danger btn-sm" data-action="rollback-version" data-version="${version.version}">回滚</button>` : ''}</td></tr>`).join('');
    const diffRows = Data.audit.diff.map((item) => `<tr><td><code>${UI.escapeHtml(item.field)}</code></td><td>${UI.escapeHtml(item.before)}</td><td>${UI.escapeHtml(item.after)}</td><td>${item.certainty ? UI.badge(item.certainty, item.certainty === 'certain' ? 'approved' : 'warning') : '—'}</td></tr>`).join('');
    const lineage = Data.audit.lineage.map((item, index) => `<div class="timeline-item"><span class="timeline-dot"></span><small>${item.time}</small><strong>${UI.escapeHtml(item.title)}</strong><p>${UI.escapeHtml(item.detail)}</p>${index < Data.audit.lineage.length - 1 ? '<i></i>' : ''}</div>`).join('');
    const logs = Data.audit.logs.map((log) => `<tr><td>${UI.escapeHtml(log.actor)}</td><td>${UI.badge(log.action, log.action)}</td><td>${UI.escapeHtml(log.field)}</td><td>${UI.escapeHtml(log.change)}</td></tr>`).join('');
    return `${UI.pageHeader('版本与审计', '版本遵循 raw → ai_candidate → reviewer → expert → admin_approved，记录只追加、历史不可变。', `${UI.button('刷新版本', { action: 'toast', icon: 'audit' })}${primary('导出当前版本', 'download-export', 'download')}`)}<section class="card version-list-card">${sectionTitle(`${Data.audit.version} 版本列表`, '支持版本对比与一键回滚', UI.badge('5 个版本', 'completed'))}${tableShell(['版本', '阶段', '操作者', '时间', '状态', '操作'], versions)}</section><div class="audit-grid"><section class="card">${sectionTitle('版本谱系', '全链路不可变版本')}<div class="timeline">${lineage}</div></section><section class="card">${sectionTitle('版本差异', 'reviewed v1 ↔ approved v1')}${tableShell(['字段', 'Before', 'After', 'Certainty'], diffRows)}<div class="danger-zone"><div><strong>回滚 reviewed v1</strong><p>系统会生成新版本，不删除任何历史记录。</p></div>${UI.button('一键回滚', { action: 'rollback-version', variant: 'danger' })}</div></section></div><section class="card audit-log-card">${sectionTitle('操作日志', '关键字段 Before → After')}${tableShell(['Actor', 'Action', '字段', 'Before → After'], logs)}</section>`;
  }

  function renderExport() {
    const cards = Data.exports.map((item) => `<article class="export-card"><span class="export-icon">${item.id === 'gold' ? UI.icon('quality') : UI.icon('download')}</span><h3>${UI.escapeHtml(item.title)}</h3><p>${UI.escapeHtml(item.description)}</p><button class="btn ${item.id === 'gold' ? 'btn-primary' : 'btn-secondary'}" data-action="download-export" data-export="${item.id}">创建导出</button></article>`).join('');
    return `${UI.pageHeader('数据导出', 'Gold / Reviewed / AI Pseudo / Feedback 严格分开，防止伪标签误操作人工真值。', UI.badge('JSON Schema v1.1', 'completed'))}<section class="export-grid">${cards}</section><section class="card">${sectionTitle('格式与范围')}<div class="field-row wide"><label class="field"><span>格式</span><select><option>Annotation JSON</option><option>JSON-LD（扩展）</option></select></label><label class="field"><span>Split</span><select><option>all</option><option>train</option><option>val</option><option>test</option></select></label></div></section>`;
  }

  function renderWorkbench() {
    return window.WorkbenchPage.render();
  }

  function renderTasks() {
    const role = state().role === 'expert' ? 'expert' : 'reviewer';
    const tasks = Data.tasks[role] || Data.tasks.reviewer;
    const rows = tasks.map((task) => `<tr><td><strong>${UI.escapeHtml(task.name)}</strong><small>${UI.escapeHtml(task.id)}</small></td><td>${task.samples}</td><td>${UI.badge(task.priority, task.priority === '高' ? 'failed' : 'ai-ready')}</td><td>${UI.escapeHtml(task.deadline)}</td><td>${UI.progress(task.progress)}</td><td>${UI.statusBadge(task.status === '已完成' ? 'COMPLETED' : 'IN_REVIEW')}</td><td><button class="btn btn-primary btn-sm" data-route="workbench">进入工作台</button></td></tr>`).join('');
    return `${UI.pageHeader('我的任务', '仅展示当前身份被分配的样本与截止时间。', UI.button('刷新', { action: 'toast', icon: 'audit' }))}<section class="card">${tableShell(['任务', '样本数', '优先级', '截止时间', '进度', '状态', '操作'], rows)}</section>`;
  }

  function renderRecords() {
    const rows = Data.records.map((record) => `<tr><td>${UI.escapeHtml(record.time)}</td><td><strong>${UI.escapeHtml(record.sample)}</strong></td><td>${UI.badge(record.action, record.action)}</td><td>${UI.escapeHtml(record.role)}</td><td>${UI.escapeHtml(record.result)}</td><td>${UI.escapeHtml(record.detail)}</td></tr>`).join('');
    return `${UI.pageHeader('我的审核记录', '记录当前身份的接受、修改、退回与提交动作。', UI.button('导出记录', { action: 'download-export', icon: 'download' }))}<section class="card">${tableShell(['时间', '样本', '动作', '操作者', '结果', '详情'], rows)}</section>`;
  }

  window.Pages = {
    overview: renderOverview,
    samples: renderSamples,
    assignment: renderAssignment,
    'ai-tasks': renderAiTasks,
    workflow: renderWorkflow,
    taxonomy: renderTaxonomy,
    'ai-config': renderAiConfig,
    quality: renderQuality,
    users: renderUsers,
    audit: renderAudit,
    export: renderExport,
    workbench: renderWorkbench,
    'my-tasks': renderTasks,
    'review-records': renderRecords
  };
})();










