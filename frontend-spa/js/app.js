/** 应用外壳、路由守卫、角色切换与交互事件。 */
(function () {
  const Permission = window.PermissionConfig;
  const UI = window.UI;
  const Data = window.MockData;
  const app = document.getElementById('app');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');
  let drawSession = null;
  const savedRole = (() => {
    try { return localStorage.getItem(window.APP_CONFIG.storageKey); } catch (error) { return null; }
  })();

  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(window.APP_CONFIG.authStorageKey) || 'null'); } catch (error) { return null; }
  })();
  function mapBackendRole(role) {
    const map = { '管理员': 'admin', 'admin': 'admin', '标注员': 'reviewer', '标注审核员': 'reviewer', 'reviewer': 'reviewer', '专家审核员': 'expert', 'expert': 'expert', '只读研究员': 'researcher', '研究员': 'researcher', 'researcher': 'researcher' };
    return map[role] || 'reviewer';
  }
  const CUSTOM_TAG_STORAGE_KEY = 'mural-custom-tags';
  const savedCustomTags = (() => {
    try {
      return Object.assign({ attributes: [], states: [], actions: [], relations: [] }, JSON.parse(localStorage.getItem(CUSTOM_TAG_STORAGE_KEY) || '{}'));
    } catch (error) {
      return { attributes: [], states: [], actions: [], relations: [] };
    }
  })();
  const requestedRole = new URLSearchParams(window.location.search).get('role');

  window.AppState = {
    role: savedSession ? mapBackendRole(savedSession.role) : (Permission.roles[requestedRole] ? requestedRole : (Permission.roles[savedRole] ? savedRole : (window.API && window.API.isMock ? 'admin' : 'reviewer'))),
    route: '',
    workbenchTab: 'entity',
    selectedEntityIndex: 0,
    drawBoxMode: false,
    userTab: 'users',
    selectedSample: (Data.samples && Data.samples[0] && Data.samples[0].id) || 'MURAL-02315',
    annotationDraft: JSON.parse(JSON.stringify(Data.annotationEditor)),
    annotationSaved: false,
    uploadedImagePreview: '',
    uploadedSampleId: '',
    annotationJob: null,
    session: savedSession,
    annotationId: '',
    versions: null,
    versionsLoading: false,
    customTags: savedCustomTags,
    sidebarOpen: false
  };

  function currentRole() { return Permission.getRole(window.AppState.role); }
  function routeFromHash() { return (window.location.hash || '').replace(/^#\/?/, '').trim(); }
  function routeTitle(key) { return Permission.routes[key] ? Permission.routes[key].title : '未知页面'; }
  function persistRole() { try { localStorage.setItem(window.APP_CONFIG.storageKey, window.AppState.role); } catch (error) { /* 忽略文件模式限制 */ } }
  function persistCustomTags() { try { localStorage.setItem(CUSTOM_TAG_STORAGE_KEY, JSON.stringify(window.AppState.customTags)); } catch (error) { /* 忽略文件模式限制 */ } }
  function persistSession(session) {
    window.AppState.session = session;
    try { session ? localStorage.setItem(window.APP_CONFIG.authStorageKey, JSON.stringify(session)) : localStorage.removeItem(window.APP_CONFIG.authStorageKey); } catch (error) { /* 忽略文件模式限制 */ }
  }

  function toast(message, tone) {
    const node = document.createElement('div');
    node.className = `toast toast-${tone || 'info'}`;
    node.innerHTML = `<span>${UI.icon(tone === 'danger' ? 'lock' : tone === 'success' ? 'check' : 'info', 17)}</span><p>${UI.escapeHtml(message)}</p>`;
    toastRoot.appendChild(node);
    window.setTimeout(() => { node.classList.add('leaving'); window.setTimeout(() => node.remove(), 220); }, 2800);
  }

  function closeModal() { modalRoot.innerHTML = ''; document.body.classList.remove('modal-open'); }

  function showPermissionModal(deniedKey, roleId, source) {
    const role = Permission.getRole(roleId);
    const homeKey = Permission.routes[role.home] ? role.home : 'overview';
    modalRoot.innerHTML = `
      <div class="modal-backdrop" role="presentation"><section class="permission-modal" role="dialog" aria-modal="true" aria-labelledby="permission-title"><div class="modal-icon">${UI.icon('lock', 30)}</div><span class="eyebrow">权限校验未通过</span><h2 id="permission-title">当前身份无法查看此页面</h2><p>${source === 'role-switch' ? '身份切换后，' : '当前访问路径命中权限规则：'}当前身份「<strong>${UI.escapeHtml(role.label)}</strong>」没有模块「<strong>${UI.escapeHtml(routeTitle(deniedKey))}</strong>」的访问权限。</p><div class="permission-route"><span>已拦截页面</span><strong>${UI.escapeHtml(routeTitle(deniedKey))}</strong><i>${UI.icon('arrow', 16)}</i><span>返回主页</span><strong>${UI.escapeHtml(routeTitle(homeKey))}</strong></div><button class="btn btn-primary" id="permission-home-button">${UI.icon('overview', 16)}<span>返回${UI.escapeHtml(routeTitle(homeKey))}</span></button></section></div>`;
    document.body.classList.add('modal-open');
    document.getElementById('permission-home-button').addEventListener('click', closeModal);
  }

  function loadAnnotationVersions() {
    const annotationId = window.AppState.annotationId;
    if (!annotationId || window.AppState.versionsLoading) return;
    window.AppState.versionsLoading = true;
    window.API.getAnnotationVersions(annotationId)
      .then((versions) => { window.AppState.versions = versions || []; })
      .catch((error) => toast(error.message || '版本列表加载失败', 'danger'))
      .finally(() => { window.AppState.versionsLoading = false; render(); });
  }

  function render() {
    const role = currentRole();
    if (!Permission.canAccess(role.id, window.AppState.route)) {
      const denied = window.AppState.route;
      window.AppState.route = role.home;
      history.replaceState(null, '', `#/${role.home}`);
      renderShell();
      if (denied && Permission.routes[denied]) showPermissionModal(denied, role.id, 'route');
      return;
    }
    renderShell();
  }

  function guardRoute(routeKey, source) {
    const role = currentRole();
    if (!Permission.routes[routeKey]) {
      window.AppState.route = role.home;
      history.replaceState(null, '', `#/${role.home}`);
      render();
      toast(`页面「${routeKey || '未知'}」不存在，已返回主页面`, 'danger');
      return false;
    }
    if (!Permission.canAccess(role.id, routeKey)) {
      window.AppState.route = role.home;
      history.replaceState(null, '', `#/${role.home}`);
      render();
      showPermissionModal(routeKey, role.id, source || 'route');
      return false;
    }
    return true;
  }

  function navMarkup() {
    const role = currentRole();
    return Permission.getVisibleNavigation(role.id).map((group) => `<div class="nav-group"><div class="nav-label">${UI.escapeHtml(group.label)}</div>${group.items.map((key) => `<a class="nav-item ${window.AppState.route === key ? 'active' : ''}" href="#/${key}" data-route="${key}">${UI.icon(key, 18)}<span>${UI.escapeHtml(Permission.routes[key].shortTitle || Permission.routes[key].title)}</span></a>`).join('')}</div>`).join('');
  }

  function roleOptions() {
    return Permission.getAllRoles().map((role) => `<option value="${role.id}" ${role.id === window.AppState.role ? 'selected' : ''}>${UI.escapeHtml(role.label)}</option>`).join('');
  }

  function renderLogin(errorMessage) {
    app.innerHTML = `<main class="login-screen"><section class="login-card"><div class="login-brand"><div class="brand-mark">壁</div><div><strong>壁画结构化语义标注系统</strong><small>结构化审核与标注工作台</small></div></div><h1>账号登录</h1><p>请使用后端接口说明书中的测试账号登录。标注员：han / 123；管理员：admin / 123。</p><form id="login-form"><label class="field"><span>用户名</span><input name="username" autocomplete="username" value="han" required /></label><label class="field"><span>密码</span><input type="password" name="password" autocomplete="current-password" value="123" required /></label>${errorMessage ? `<div class="login-error">${UI.escapeHtml(errorMessage)}</div>` : ''}<button class="btn btn-primary login-submit" type="submit">登录并进入系统</button></form><small class="login-endpoint">接口地址：${UI.escapeHtml(window.APP_CONFIG.apiBase)}</small></section></main>`;
  }

  function renderShell() {
    const role = currentRole();
    const hiddenCount = Permission.getHiddenCount(role.id);
    const identityName = window.AppState.session && window.AppState.session.username ? window.AppState.session.username : role.username;
    const roleControl = window.API.isMock ? `<label class="role-switch"><span>身份切换</span><select id="role-switcher" aria-label="切换身份">${roleOptions()}</select></label>` : `<button class="btn btn-secondary btn-sm" data-action="logout">退出登录</button>`;
    app.innerHTML = `
      <div class="app-shell ${window.AppState.sidebarOpen ? 'sidebar-open' : ''}"><div class="sidebar-scrim" data-action="close-sidebar"></div><aside class="sidebar"><div class="brand-block"><div class="brand-mark">壁</div><div><strong>壁画结构化语义标注系统</strong><small>AI标注 → 审核 → 专家复核 → 管理员验收</small></div></div><nav class="side-nav">${navMarkup()}</nav><div class="sidebar-footer"><span>${window.APP_CONFIG.appVersion}</span><small>角色工作区 · ${role.label}</small></div></aside><div class="workspace"><header class="topbar"><button class="mobile-menu" data-action="open-sidebar" aria-label="打开导航">${UI.icon('menu', 20)}</button><div class="project-crumb"><strong>壁画结构化语义标注项目</strong><span>${UI.escapeHtml(Data.project ? Data.project.taxonomy : 'taxonomy v1.1-custom')}</span></div><div class="topbar-spacer"></div><div class="topbar-icon" title="搜索">${UI.icon('search', 19)}</div><div class="topbar-icon notification-icon" title="通知">${UI.icon('bell', 19)}<span></span></div><div class="identity-block"><div class="identity-copy"><strong>${UI.escapeHtml(identityName)}</strong><small>${UI.escapeHtml(role.label)} · 隐藏 ${hiddenCount} 个模块</small></div><div class="identity-badge badge-${role.tone}">${UI.escapeHtml(role.badge)}</div></div>${roleControl}</header><main class="page-content" id="page-content"></main></div></div>`;
    const content = document.getElementById('page-content');
    const renderer = window.Pages[window.AppState.route];
    content.innerHTML = renderer ? renderer() : UI.emptyState('页面未实现', '请在 pages.js 中注册该页面。');
    document.title = `${routeTitle(window.AppState.route)} · 壁画结构化语义标注系统`;
  }

  function navigate(routeKey, options) {
    const opts = options || {};
    if (!Permission.routes[routeKey]) { toast('目标页面不存在', 'danger'); return; }
    const role = currentRole();
    if (!Permission.canAccess(role.id, routeKey)) {
      window.AppState.route = role.home;
      history.replaceState(null, '', `#/${role.home}`);
      render();
      showPermissionModal(routeKey, role.id, 'route');
      return;
    }
    window.AppState.route = routeKey;
    window.AppState.sidebarOpen = false;
    if (routeFromHash() !== routeKey) {
      if (opts.replace) history.replaceState(null, '', `#/${routeKey}`);
      else window.location.hash = `/${routeKey}`;
    }
    render();
  }

  function switchRole(roleId) {
    if (!Permission.roles[roleId]) return;
    const previousRoute = window.AppState.route;
    window.AppState.role = roleId;
    persistRole();
    const role = currentRole();
    const denied = !Permission.canAccess(roleId, previousRoute);
    if (denied) {
      window.AppState.route = role.home;
      history.replaceState(null, '', `#/${role.home}`);
      render();
      showPermissionModal(previousRoute, roleId, 'role-switch');
    } else {
      render();
      toast(`已切换为「${role.label}」，当前页面仍可访问`, 'success');
    }
  }

  async function downloadExport(type) {
    try {
      const exportType = type || 'gold';
      let blob;
      if (window.AppState.annotationId) {
        const exported = await window.API.exportAnnotation(window.AppState.annotationId);
        blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      } else {
        blob = await window.API.downloadExport(exportType);
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `mural-${exportType}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`${exportType} 标注 JSON 已生成`, 'success');
    } catch (error) { toast(error.message || '导出失败', 'danger'); }
  }

  function exportAnnotationJson() {
    const payload = { schemaVersion: '1.1', taxonomy: Data.project.taxonomy, sample: window.AppState.selectedSample, annotation: toContractAnnotation(window.AppState.annotationDraft), exportedAt: new Date().toISOString() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${window.AppState.selectedSample}-annotation.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function collectAnnotationDraft() {
    const draft = window.AppState.annotationDraft || {};
    document.querySelectorAll('[data-field]').forEach((field) => {
      const path = field.dataset.field.split('.');
      let target = draft;
      path.slice(0, -1).forEach((part) => {
        const key = /^\d+$/.test(part) ? Number(part) : part;
        if (target[key] == null) target[key] = /^\d+$/.test(path[path.indexOf(part) + 1]) ? [] : {};
        target = target[key];
      });
      const last = path[path.length - 1];
      target[/^\d+$/.test(last) ? Number(last) : last] = field.type === 'number' ? Number(field.value) : field.value;
    });
    window.AppState.annotationDraft = draft;
  }

  function setAnnotationTag(kind, value, selected) {
    collectAnnotationDraft();
    const draft = window.AppState.annotationDraft;
    const entity = draft.entities && draft.entities[Number(window.AppState.selectedEntityIndex || 0)];
    if (!entity) return;
    const tag = String(value || '').trim().slice(0, 40);
    if (!tag) return;
    if (kind === 'attributes') {
      let parts = splitList(entity.attributes);
      const exists = parts.some((part) => part.split(/[=:：]/)[0].trim() === tag);
      if (selected && !exists) parts.push(`${tag}=`);
      if (!selected) parts = parts.filter((part) => part.split(/[=:：]/)[0].trim() !== tag);
      entity.attributes = parts.join('；');
    } else {
      let parts = splitList(entity[kind]);
      const exists = parts.includes(tag);
      if (selected && !exists) parts.push(tag);
      if (!selected) parts = parts.filter((item) => item !== tag);
      entity[kind] = parts.join('；');
    }
    render();
  }

  function addCustomTag(kind, value) {
    const tag = String(value || '').trim().slice(0, 40);
    if (!tag) { toast('请输入标签名称', 'danger'); return; }
    if (!window.AppState.customTags[kind]) window.AppState.customTags[kind] = [];
    if (!window.AppState.customTags[kind].includes(tag)) window.AppState.customTags[kind].push(tag);
    persistCustomTags();
    if (window.AppState.route === 'workbench') setAnnotationTag(kind, tag, true);
    else render();
    toast(`已添加自定义标签：${tag}`, 'success');
  }

  function removeCustomTag(kind, value) {
    window.AppState.customTags[kind] = (window.AppState.customTags[kind] || []).filter((tag) => tag !== value);
    persistCustomTags();
    setAnnotationTag(kind, value, false);
    toast(`已移除自定义标签：${value}`, 'info');
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function addManualBox(bbox) {
    collectAnnotationDraft();
    const draft = window.AppState.annotationDraft;
    const entities = draft.entities || (draft.entities = []);
    let number = entities.length + 1;
    let id = `E${number}`;
    while (entities.some((entity) => entity.id === id)) { number += 1; id = `E${number}`; }
    entities.push({
      id,
      baseCategory: 'HUMAN',
      subCategory: '普通人物',
      fineCategory: '待确认',
      normalizedValue: '待确认',
      certainty: 'unknown',
      evidence: 'manual_bbox',
      bbox,
      attributes: '',
      states: '',
      actions: '',
      visibility: 'clear'
    });
    window.AppState.selectedEntityIndex = entities.length - 1;
    window.AppState.workbenchTab = 'entity';
    window.AppState.drawBoxMode = false;
    window.AppState.annotationSaved = false;
    render();
    toast(`已手动添加标注框 ${id}，请在“实体与标签”中完善类别`, 'success');
  }

  function deleteSelectedEntity() {
    collectAnnotationDraft();
    const draft = window.AppState.annotationDraft;
    const entities = draft.entities || [];
    const index = Number(window.AppState.selectedEntityIndex || 0);
    const removed = entities[index];
    if (!removed || entities.length <= 1) { toast('至少保留一个标注框', 'danger'); return; }
    entities.splice(index, 1);
    draft.relations = (draft.relations || []).filter((relation) => relation.source !== removed.id && relation.target !== removed.id);
    window.AppState.selectedEntityIndex = Math.max(0, index - 1);
    window.AppState.annotationSaved = false;
    render();
    toast(`已删除标注框 ${removed.id}`, 'info');
  }

  function splitList(value) {
    return String(value || '').split(/[;；,，、]/).map((item) => item.trim()).filter(Boolean);
  }

  function parseAttributes(value) {
    return splitList(value).reduce((result, item) => {
      const parts = item.split(/[=:：]/);
      if (parts[0]) result[parts[0].trim()] = (parts[1] || '').trim();
      return result;
    }, {});
  }

  function findCategoryNode(nodes, value) {
    const target = String(value || '');
    for (const node of nodes || []) {
      if (String(node.code) === target || String(node.label) === target) return node;
      const child = findCategoryNode(node.children, target);
      if (child) return child;
    }
    return null;
  }

  function normalizeCertainty(value, label) {
    const numeric = { 1: 'unknown', 2: 'possible', 3: 'probable', 4: 'certain' };
    const text = String(label || value || '').toLowerCase();
    if (text.includes('明确') || text === 'certain' || text === '4') return 'certain';
    if (text.includes('较可能') || text === 'probable' || text === '3') return 'probable';
    if (text.includes('可能') || text === 'possible' || text === '2') return 'possible';
    if (text.includes('无法') || text === 'unknown' || text === '1') return 'unknown';
    return numeric[Number(value)] || 'certain';
  }

  function normalizeVisibility(value, label) {
    const numeric = { 1: 'clear', 2: 'partial', 3: 'occluded', 4: 'damaged', 5: 'unclear', 6: 'missing' };
    const text = String(label || value || '').toLowerCase();
    return Data.taxonomy.visibility.includes(text) ? text : (numeric[Number(value)] || 'clear');
  }

  function attributesToText(attributes) {
    if (typeof attributes === 'string') return attributes;
    return Object.entries(attributes || {}).map(([key, value]) => `${key}=${value}`).join('；');
  }

  function normalizeAnnotation(result) {
    const source = result || {};
    const topNodes = Data.taxonomy.entityTree;
    const sceneTop = findCategoryNode(Data.taxonomy.sceneTree, source.scene && (source.scene.level1 || source.scene.primary));
    const sceneSecond = findCategoryNode(Data.taxonomy.sceneTree, source.scene && (source.scene.level2 || source.scene.secondary || source.scene.type));
    return {
      viewType: source.view_type || source.viewType || 'full_scene',
      scene: {
        level1: (sceneTop && sceneTop.code) || 'SCENE_OTHER',
        level2: (sceneSecond && sceneSecond.code) || 'SCENE_OTHER_GENERAL',
        themes: Array.isArray(source.scene && source.scene.themes) ? source.scene.themes.join('、') : ((source.scene && source.scene.themes) || (sceneSecond && sceneSecond.label) || ''),
        certainty: normalizeCertainty(source.scene && source.scene.confidence, source.scene && source.scene.certainty_label),
        evidence: Array.isArray(source.scene && source.scene.evidence) ? source.scene.evidence.join('；') : ((source.scene && source.scene.evidence) || 'caption_explicit')
      },
      regions: (source.regions || []).map((region, index) => ({ id: region.id || `R${index + 1}`, type: region.type || region.region_type || '', bbox: (region.bbox || []).map(Number) })),
      entities: (source.entities || []).map((entity, index) => {
        const top = findCategoryNode(topNodes, entity.base_category || entity.baseCategory) || topNodes[0];
        const sub = findCategoryNode(top.children, entity.sub_category || entity.subCategory) || top.children[0];
        const fineValue = entity.fine_category || entity.fineCategory;
        const fine = findCategoryNode(sub.children, typeof fineValue === 'object' ? (fineValue.raw_value || fineValue.normalized_value) : fineValue) || sub.children[0];
        return { id: entity.id || `E${index + 1}`, baseCategory: top.code, subCategory: sub.code, fineCategory: fine.code, normalizedValue: (typeof fineValue === 'object' && fineValue.normalized_value) || entity.normalized_value || fine.label, certainty: normalizeCertainty(entity.confidence, entity.certainty_label || (fineValue && fineValue.certainty)), evidence: Array.isArray(entity.evidence) ? entity.evidence.join('；') : (entity.evidence || 'caption_explicit'), bbox: (entity.bbox || []).map(Number), attributes: attributesToText(entity.attributes), states: Array.isArray(entity.states) ? entity.states.join('；') : (entity.states || ''), actions: Array.isArray(entity.actions) ? entity.actions.join('；') : (entity.actions || ''), visibility: normalizeVisibility(entity.visibility, entity.visibility_label) };
      }),
      groups: (source.groups || []).map((group, index) => ({ id: group.id || `G${index + 1}`, type: group.type || '', count: group.count == null ? 0 : group.count, countType: group.count_type || group.countType || 'exact', members: Array.isArray(group.members) ? group.members.join(', ') : (group.members || ''), sharedStates: Array.isArray(group.shared_states) ? group.shared_states.join('；') : (group.shared_states || '') })),
      events: (source.events || []).map((event, index) => ({ id: event.id || `EV${index + 1}`, family: event.family || '', type: event.type || '', region: event.region || '', participants: (event.participants || []).map((item) => `${item.node}=${item.role}`).join('；'), certainty: normalizeCertainty(event.confidence, event.certainty_label || event.certainty) })),
      relations: (source.relations || []).map((relation, index) => ({ id: relation.id || `REL${index + 1}`, family: relation.family || 'SPATIAL', type: relation.type || '', source: relation.source || '', target: relation.target || '', certainty: normalizeCertainty(relation.confidence, relation.certainty_label || relation.certainty), evidence: Array.isArray(relation.evidence) ? relation.evidence.join('；') : (relation.evidence || '') }))
    };
  }

  function toContractAnnotation(draft) {
    return {
      view_type: draft.viewType,
      scene: { level1: draft.scene && draft.scene.level1, level2: draft.scene && draft.scene.level2, themes: splitList(draft.scene && draft.scene.themes), certainty: draft.scene && draft.scene.certainty, evidence: splitList(draft.scene && draft.scene.evidence) },
      regions: (draft.regions || []).map((region) => ({ id: region.id, type: region.type, bbox: (region.bbox || []).map(Number) })),
      entities: (draft.entities || []).map((entity) => ({
        id: entity.id,
        base_category: entity.baseCategory,
        sub_category: entity.subCategory,
        fine_category: { raw_value: entity.fineCategory, normalized_value: entity.normalizedValue, certainty: entity.certainty, evidence: splitList(entity.evidence) },
        bbox: (entity.bbox || []).map(Number),
        attributes: parseAttributes(entity.attributes),
        states: splitList(entity.states),
        actions: splitList(entity.actions),
        visibility: entity.visibility
      })),
      groups: (draft.groups || []).map((group) => ({ id: group.id, type: group.type, count: Number(group.count), count_type: group.countType, members: splitList(group.members), shared_attributes: {}, shared_states: splitList(group.sharedStates), shared_actions: [] })),
      events: (draft.events || []).map((event) => ({ id: event.id, family: event.family, type: event.type, participants: splitList(event.participants).map((item) => { const parts = item.split(/[=:：]/); return { node: (parts[0] || item).trim(), role: (parts[1] || '').trim() }; }), certainty: event.certainty })),
      relations: (draft.relations || []).map((relation) => ({ id: relation.id, family: relation.family, type: relation.type, source: relation.source, target: relation.target, certainty: relation.certainty, evidence: splitList(relation.evidence) }))
    };
  }

  async function saveAnnotation() {
    collectAnnotationDraft();
    const annotationId = window.AppState.annotationId || window.AppState.uploadedSampleId || window.AppState.selectedSample;
    if (window.API.saveAnnotation) await window.API.saveAnnotation(annotationId, toContractAnnotation(window.AppState.annotationDraft));
    window.AppState.annotationSaved = true;
    render();
    toast('人工修正已保存，版本记录已追加', 'success');
  }

  function callApi(task, successMessage) {
    Promise.resolve(task)
      .then(() => toast(successMessage, 'success'))
      .catch((error) => toast(error.message || '接口调用失败', 'danger'));
  }

  function resetBboxes() {
    collectAnnotationDraft();
    const draft = window.AppState.annotationDraft;
    const originals = Data.annotationEditor.entities || [];
    (draft.entities || []).forEach((entity, index) => {
      const original = originals.find((item) => item.id === entity.id) || originals[index];
      if (original && original.bbox) entity.bbox = original.bbox.slice();
    });
    window.AppState.annotationSaved = false;
    render();
    toast('已重置为 AI 原始 BBox', 'success');
  }

  function rerunAi() {
    const sampleId = window.AppState.uploadedSampleId || window.AppState.selectedSample;
    callApi(window.API.annotateSample(sampleId).then((result) => {
      window.AppState.annotationId = result.annotation_id || window.AppState.annotationId;
      if (result.result) window.AppState.annotationDraft = normalizeAnnotation(result.result);
      window.AppState.selectedEntityIndex = 0;
      window.AppState.drawBoxMode = false;
      render();
    }), 'AI 已重新运行，Candidate 标注已更新');
  }

  function previewJson() {
    collectAnnotationDraft();
    const payload = toContractAnnotation(window.AppState.annotationDraft);
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="json-preview-modal"><div class="panel-title-row"><div><strong>Annotation JSON 预览</strong><small>教程 8.2 推荐结构</small></div><button class="btn btn-secondary btn-sm" id="close-json-preview">关闭</button></div><pre>${UI.escapeHtml(JSON.stringify(payload, null, 2))}</pre></section></div>`;
    document.body.classList.add('modal-open');
    document.getElementById('close-json-preview').addEventListener('click', closeModal);
  }

  function handleAction(actionName, element) {
    switch (actionName) {
      case 'toast': toast(element.dataset.message || '操作已完成', 'success'); break;
      case 'logout': persistSession(null); renderLogin(); break;
      case 'open-sidebar': window.AppState.sidebarOpen = true; render(); break;
      case 'close-sidebar': window.AppState.sidebarOpen = false; render(); break;
      case 'bulk-ai': toast('批量 AI 标注任务已创建：BATCH-' + String(Date.now()).slice(-3), 'success'); break;
      case 'create-assignment': callApi(window.API.createAssignment({ taskName: 'AI 标注结果审核', sampleIds: ['MURAL-02315', 'MURAL-02314'] }), '任务已创建并分配给审核员'); break;
      case 'save-workflow': callApi(window.API.saveWorkflow({ lifecycle: Data.workflow.lifecycle }), '工作流配置已保存'); break;
      case 'select-taxonomy': toast(`已选择词表 ${element.dataset.code}`, 'info'); break;
      case 'add-custom-tag': {
        const kind = element.dataset.kind;
        const input = document.querySelector(`[data-custom-tag-input="${kind}"]`);
        addCustomTag(kind, input ? input.value : '');
        if (input) input.value = '';
        break;
      }
      case 'add-taxonomy-tag': {
        const kind = document.getElementById('taxonomy-tag-kind').value;
        const input = document.getElementById('taxonomy-tag-input');
        addCustomTag(kind, input.value);
        input.value = '';
        break;
      }
      case 'toggle-annotation-tag': setAnnotationTag(element.dataset.kind, element.dataset.value, element.dataset.selected !== 'true'); break;
      case 'remove-custom-tag': removeCustomTag(element.dataset.kind, element.dataset.value); break;
      case 'save-taxonomy': callApi(window.API.saveTaxonomy({ entity: 'HUMAN', subCategory: '侍从类' }), '标签修改已保存到草稿'); break;
      case 'publish-taxonomy': callApi(window.API.saveTaxonomy({ publish: true }), 'taxonomy v1.2-custom 已发布'); break;
      case 'select-stage': toast(`已载入 ${element.dataset.stage} 配置`, 'info'); break;
      case 'test-stage': toast('Stage 沙箱测试通过，耗时 4.8s', 'success'); break;
      case 'publish-ai-config': callApi(window.API.publishAiConfig({ pipeline: Data.aiConfig.pipeline }), 'AI 配置已发布至生产环境'); break;
      case 'add-rule': toast('已打开新增质检规则表单', 'info'); break;
      case 'edit-rule': toast(`正在编辑 ${element.dataset.code}`, 'info'); break;
      case 'switch-user-tab': window.AppState.userTab = element.dataset.tab; render(); break;
      case 'permission-toggle': {
        const targetRole = element.dataset.role;
        const routeKey = element.dataset.route;
        const permissions = Permission.getRole(targetRole).permissions.slice();
        const index = permissions.indexOf(routeKey);
        if (index >= 0) permissions.splice(index, 1); else permissions.push(routeKey);
        Permission.setRolePermissions(targetRole, permissions);
        const affectsCurrent = targetRole === window.AppState.role && routeKey === window.AppState.route && index >= 0;
        render();
        if (affectsCurrent) {
          toast('当前角色已失去本页权限，正在返回主页', 'danger');
          const role = currentRole();
          window.AppState.route = role.home;
          history.replaceState(null, '', `#/${role.home}`);
          render();
          showPermissionModal(routeKey, role.id, 'role-switch');
        } else toast('角色权限已更新，导航栏已同步', 'success');
        break;
      }
      case 'reset-permissions': Permission.resetRolePermissions(); render(); toast('已恢复系统默认权限', 'success'); break;
      case 'add-user': toast('已打开新增用户表单', 'info'); break;
      case 'compare-version': toast('当前接口说明书暂未提供版本对比接口', 'info'); break;
      case 'rollback-version': { const annotationId = window.AppState.annotationId || window.AppState.selectedSample; const targetVersion = element.dataset.version || 1; callApi(window.API.rollbackAnnotation(annotationId, targetVersion), '已创建回滚版本，历史版本未删除'); break; }
      case 'download-export': downloadExport(element.dataset.export || (window.AppState.route === 'audit' ? 'gold' : null)); break;
      case 'export-json': exportAnnotationJson(); toast('标注 JSON 已下载', 'success'); break;
      case 'upload-sample': document.getElementById('workbench-file').click(); break;
      case 'switch-workbench-tab': window.AppState.workbenchTab = element.dataset.tab; render(); break;
      case 'rerun-ai': rerunAi(); break;
      case 'reset-bboxes': resetBboxes(); break;
      case 'preview-json': previewJson(); break;
      case 'toggle-draw-box': window.AppState.drawBoxMode = !window.AppState.drawBoxMode; render(); break;
      case 'select-entity-box': if (element.dataset.index != null) { collectAnnotationDraft(); window.AppState.selectedEntityIndex = Number(element.dataset.index); window.AppState.workbenchTab = 'entity'; render(); } break;
      case 'delete-entity-box': deleteSelectedEntity(); break;
      case 'open-sample': window.AppState.selectedSample = element.dataset.id; window.AppState.annotationId = ''; window.AppState.versions = null; window.AppState.uploadedSampleId = ''; window.AppState.uploadedImagePreview = ''; window.AppState.annotationDraft = JSON.parse(JSON.stringify(Data.annotationEditor)); window.AppState.selectedEntityIndex = 0; window.AppState.drawBoxMode = false; window.AppState.annotationSaved = false; render(); break;
      case 'save-annotation': saveAnnotation().catch((error) => toast(error.message, 'danger')); break;
      case 'submit-review': collectAnnotationDraft(); window.AppState.annotationSaved = true; toast('已提交给专家复核', 'success'); setTimeout(() => navigate('my-tasks'), 700); break;
      default: toast('该操作已在原型中预留', 'info');
    }
  }

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'login-form') return;
    event.preventDefault();
    const form = event.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '正在登录…';
    window.API.login(username, password)
      .then((session) => {
        persistSession(session);
        window.AppState.role = mapBackendRole(session.role);
        persistRole();
        window.AppState.route = currentRole().home;
        history.replaceState(null, '', `#/${window.AppState.route}`);
        render();
        toast(window.APP_CONFIG.usingFallback ? '后端暂不可达，已切换到本地种子数据展示' : `登录成功：${session.username} · ${session.role}`, window.APP_CONFIG.usingFallback ? 'info' : 'success');
      })
      .catch((error) => renderLogin(error.message || '登录失败'))
      .finally(() => { const current = document.querySelector('#login-form button[type="submit"]'); if (current) current.disabled = false; });
  });

  document.addEventListener('click', (event) => {
    const routeElement = event.target.closest('[data-route]');
    if (routeElement) { event.preventDefault(); navigate(routeElement.dataset.route); return; }
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) { event.preventDefault(); handleAction(actionElement.dataset.action, actionElement); }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'role-switcher') { switchRole(event.target.value); return; }
    if (event.target.id === 'workbench-file' && event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (window.AppState.uploadedImagePreview && window.AppState.uploadedImagePreview.startsWith('blob:')) URL.revokeObjectURL(window.AppState.uploadedImagePreview);
      window.AppState.uploadedImagePreview = URL.createObjectURL(file);
      render();
      (async () => {
        try {
          const uploaded = await window.API.uploadSample(file);
          const result = await window.API.annotateSample(uploaded.sample_id);
          window.AppState.uploadedSampleId = uploaded.sample_id;
          window.AppState.annotationId = result.annotation_id || '';
          window.AppState.annotationJob = result;
          if (result.result) window.AppState.annotationDraft = normalizeAnnotation(result.result);
          window.AppState.selectedEntityIndex = 0;
          window.AppState.drawBoxMode = false;
          render();
          toast(`S0–S7 自动标注完成：${uploaded.sample_id}`, 'success');
        } catch (error) {
          toast(error.message || '自动标注失败', 'danger');
        }
      })();
      return;
    }
    if (event.target.id === 'entity-box-select') {
      collectAnnotationDraft();
      window.AppState.selectedEntityIndex = Number(event.target.value);
      window.AppState.workbenchTab = 'entity';
      render();
      return;
    }
    if (event.target.dataset.sceneLevel) {
      collectAnnotationDraft();
      const level = event.target.dataset.sceneLevel;
      const draft = window.AppState.annotationDraft;
      if (level === '1') {
        const node = Data.taxonomy.sceneTree.find((item) => item.code === event.target.value) || Data.taxonomy.sceneTree[0];
        draft.scene.level1 = node.code;
        draft.scene.level2 = node.children[0].code;
      } else {
        draft.scene.level2 = event.target.value;
      }
      render();
      return;
    }
    if (event.target.dataset.entityLevel) {
      collectAnnotationDraft();
      const level = event.target.dataset.entityLevel;
      const index = Number(window.AppState.selectedEntityIndex || 0);
      const entity = window.AppState.annotationDraft.entities[index];
      const baseNode = Data.taxonomy.entityTree.find((item) => item.code === entity.baseCategory) || Data.taxonomy.entityTree[0];
      if (level === '1') {
        const node = Data.taxonomy.entityTree.find((item) => item.code === event.target.value) || Data.taxonomy.entityTree[0];
        entity.baseCategory = node.code;
        entity.subCategory = node.children[0].code;
        entity.fineCategory = node.children[0].children[0].code;
        entity.normalizedValue = node.children[0].children[0].label;
      } else if (level === '2') {
        const node = baseNode.children.find((item) => item.code === event.target.value) || baseNode.children[0];
        entity.subCategory = node.code;
        entity.fineCategory = node.children[0].code;
        entity.normalizedValue = node.children[0].label;
      } else {
        const subNode = baseNode.children.find((item) => item.code === entity.subCategory) || baseNode.children[0];
        const node = subNode.children.find((item) => item.code === event.target.value) || subNode.children[0];
        entity.fineCategory = node.code;
        entity.normalizedValue = node.label;
      }
      render();
      return;
    }
    if (event.target.matches('[data-field]')) collectAnnotationDraft();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!window.AppState.drawBoxMode || !event.target.closest('#mural-canvas')) return;
    const canvas = event.target.closest('#mural-canvas');
    const rect = canvas.getBoundingClientRect();
    const startX = clamp(event.clientX - rect.left, 0, rect.width);
    const startY = clamp(event.clientY - rect.top, 0, rect.height);
    const ghost = document.createElement('div');
    ghost.className = 'drawing-box';
    canvas.appendChild(ghost);
    drawSession = { canvas, ghost, rect, startX, startY };
    canvas.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  document.addEventListener('pointermove', (event) => {
    if (!drawSession) return;
    const x = clamp(event.clientX - drawSession.rect.left, 0, drawSession.rect.width);
    const y = clamp(event.clientY - drawSession.rect.top, 0, drawSession.rect.height);
    const left = Math.min(drawSession.startX, x);
    const top = Math.min(drawSession.startY, y);
    drawSession.ghost.style.left = `${left}px`;
    drawSession.ghost.style.top = `${top}px`;
    drawSession.ghost.style.width = `${Math.abs(x - drawSession.startX)}px`;
    drawSession.ghost.style.height = `${Math.abs(y - drawSession.startY)}px`;
  });

  function finishDraw(event) {
    if (!drawSession) return;
    const session = drawSession;
    const x = clamp(event.clientX - session.rect.left, 0, session.rect.width);
    const y = clamp(event.clientY - session.rect.top, 0, session.rect.height);
    const x1 = Math.round(Math.min(session.startX, x) / session.rect.width * 1000);
    const y1 = Math.round(Math.min(session.startY, y) / session.rect.height * 1000);
    const x2 = Math.round(Math.max(session.startX, x) / session.rect.width * 1000);
    const y2 = Math.round(Math.max(session.startY, y) / session.rect.height * 1000);
    session.ghost.remove();
    drawSession = null;
    if (x2 - x1 >= 12 && y2 - y1 >= 12) addManualBox([x1, y1, x2, y2]);
    else { window.AppState.drawBoxMode = false; render(); toast('标注框过小，请重新拖拽', 'danger'); }
  }

  document.addEventListener('pointerup', finishDraw);
  document.addEventListener('pointercancel', (event) => {
    if (drawSession && drawSession.ghost) drawSession.ghost.remove();
    drawSession = null;
    window.AppState.drawBoxMode = false;
    render();
  });

  window.addEventListener('hashchange', () => {
    const routeKey = routeFromHash() || currentRole().home;
    if (routeKey === window.AppState.route) return;
    if (guardRoute(routeKey, 'route')) { window.AppState.route = routeKey; render(); }
  });

  if (!window.API.isMock && !window.AppState.session) {
    renderLogin();
  } else {
    window.AppState.route = routeFromHash() || currentRole().home;
    if (guardRoute(window.AppState.route, 'route')) render();
  }
})();












































