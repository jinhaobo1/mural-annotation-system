/** 标注工作台：按教程实现 Scene → Region → Event → Group → Entity 五层编辑。 */
(function () {
  const Data = window.MockData;
  const UI = window.UI;
  const state = () => window.AppState;

  function getValue(annotation, path, fallback) {
    const value = path.split('.').reduce((current, key) => current == null ? undefined : current[key], annotation);
    return value == null ? fallback : value;
  }

  function option(value, current, label) {
    return `<option value="${UI.escapeHtml(value)}" ${String(value) === String(current) ? 'selected' : ''}>${UI.escapeHtml(label || value)}</option>`;
  }

  function options(values, current, labeler) {
    return values.map((item) => {
      const value = Array.isArray(item) ? item[0] : item;
      const label = labeler ? labeler(item) : (Array.isArray(item) ? `${item[0]} / ${item[1]}` : item);
      return option(value, current, label);
    }).join('');
  }

  function entityDisplayName(entity) {
    const top = Data.taxonomy.entityTree.find((item) => item.code === entity.baseCategory);
    const sub = top && top.children.find((item) => item.code === entity.subCategory);
    const fine = sub && sub.children.find((item) => item.code === entity.fineCategory);
    return (fine && fine.label) || (sub && sub.label) || (top && top.label) || entity.normalizedValue || '未标注';
  }

  function bboxInputs(annotation, prefix) {
    return [0, 1, 2, 3].map((index) => {
      const labels = ['x1', 'y1', 'x2', 'y2'];
      return `<label class="bbox-input"><span>${labels[index]}</span><input type="number" min="0" max="1000" value="${getValue(annotation, `${prefix}.${index}`, 0)}" data-field="${prefix}.${index}" /></label>`;
    }).join('');
  }

  function splitValues(value) {
    return String(value || '').split(/[;；,，、]/).map((item) => item.trim()).filter(Boolean);
  }

  function renderTagPicker(annotation, entityIndex, kind, title, standardValues) {
    const raw = getValue(annotation, `entities.${entityIndex}.${kind}`, '');
    const selected = kind === 'attributes' ? splitValues(raw).map((item) => item.split(/[=:：]/)[0].trim()) : splitValues(raw);
    const custom = (state().customTags && state().customTags[kind]) || [];
    const values = Array.from(new Set([...standardValues, ...custom]));
    const chips = values.map((value) => `<button type="button" class="tag-chip ${selected.includes(value) ? 'selected' : ''}" data-action="toggle-annotation-tag" data-kind="${kind}" data-value="${UI.escapeHtml(value)}" data-selected="${selected.includes(value)}">${selected.includes(value) ? '✓ ' : '+ '}${UI.escapeHtml(value)}</button>`).join('');
    return `<div class="tag-picker"><div class="tag-picker-head"><strong>${UI.escapeHtml(title)}</strong><span>${selected.length} 个已选</span></div><div class="tag-chip-list">${chips || '<small>暂无标签</small>'}</div><div class="custom-tag-add"><input data-custom-tag-input="${kind}" placeholder="输入新标签" /><button type="button" class="btn btn-secondary btn-sm" data-action="add-custom-tag" data-kind="${kind}">${UI.icon('plus', 14)}<span>添加</span></button></div></div>`;
  }

  function renderSceneRegion(annotation) {
    const level1 = getValue(annotation, 'scene.level1', Data.taxonomy.sceneTree[0].code);
    const level1Node = Data.taxonomy.sceneTree.find((item) => item.code === level1) || Data.taxonomy.sceneTree[0];
    const level2 = getValue(annotation, 'scene.level2', level1Node.children[0].code);
    const level2Node = level1Node.children.find((item) => item.code === level2) || level1Node.children[0];
    return `<section class="annotation-block structured-block"><div class="structured-block-head"><div><strong>Scene 场景层级</strong><small>严格按教程：一级场景 → 二级场景；一幅壁画允许多个 Scene。</small></div>${UI.button('+ 场景', { action: 'toast', className: 'btn-sm' })}</div><div class="scene-edit-card"><div class="field-grid"><label class="field"><span>一级场景 *</span><select data-scene-level="1" data-field="scene.level1">${options(Data.taxonomy.sceneTree.map((item) => item.code), level1, (item) => { const node = Data.taxonomy.sceneTree.find((scene) => scene.code === item); return `${node.code} · ${node.label}`; })}</select></label><label class="field"><span>二级场景 *</span><select data-scene-level="2" data-field="scene.level2">${options(level1Node.children.map((item) => item.code), level2, (item) => { const node = level1Node.children.find((scene) => scene.code === item); return `${node.code} · ${node.label}`; })}</select></label><label class="field"><span>Certainty</span><select data-field="scene.certainty">${options(Data.taxonomy.certainty.map((item) => item.code), getValue(annotation, 'scene.certainty', 'certain'))}</select></label><label class="field"><span>Evidence</span><select data-field="scene.evidence">${options(['caption_explicit', 'caption_inference', 'human_review', 'visual_grounded'], getValue(annotation, 'scene.evidence', 'caption_explicit'))}</select></label><label class="field"><span>审核状态</span><select data-field="scene.reviewStatus">${options(['pending', 'edited', 'approved', 'rejected'], getValue(annotation, 'scene.reviewStatus', 'pending'))}</select></label></div><div class="scene-path"><span>${UI.escapeHtml(level1Node.label)}</span><b>›</b><span>${UI.escapeHtml(level2Node.label)}</span></div><div class="structured-actions"><button class="btn btn-danger" data-action="toast">删除</button>${UI.button('保存 Scene', { action: 'save-annotation', variant: 'primary' })}</div></div><details class="region-details"><summary>Region 构图区域（可选）</summary><div class="field-grid"><label class="field"><span>Region ID</span><input value="${UI.escapeHtml(getValue(annotation, 'regions.0.id', 'R1'))}" data-field="regions.0.id" /></label><label class="field"><span>区域类型</span><input value="${UI.escapeHtml(getValue(annotation, 'regions.0.type', ''))}" data-field="regions.0.type" /></label></div><div class="bbox-grid">${bboxInputs(annotation, 'regions.0.bbox')}</div></details></section>`;
  }

  function renderEventGroup(annotation) {
    return `<div class="field-grid two-column-layers"><section class="annotation-block"><div class="annotation-title"><span>3</span><div><strong>Event 事件</strong><small>多个实体围绕同一活动形成的完整语义单元</small></div></div><label class="field"><span>family / type</span><div class="two-inputs"><input value="${UI.escapeHtml(getValue(annotation, 'events.0.family', ''))}" data-field="events.0.family" /><input value="${UI.escapeHtml(getValue(annotation, 'events.0.type', ''))}" data-field="events.0.type" /></div></label><label class="field"><span>participants / roles</span><input value="${UI.escapeHtml(getValue(annotation, 'events.0.participants', ''))}" data-field="events.0.participants" /></label><label class="field"><span>certainty</span><select data-field="events.0.certainty">${options(Data.taxonomy.certainty.map((item) => item.code), getValue(annotation, 'events.0.certainty', 'certain'))}</select></label></section><section class="annotation-block"><div class="annotation-title"><span>4</span><div><strong>Group 群组</strong><small>多人、多对象或数量短语构成的整体</small></div></div><label class="field"><span>type</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.type', ''))}" data-field="groups.0.type" /></label><div class="two-inputs"><label class="field"><span>count</span><input type="number" value="${getValue(annotation, 'groups.0.count', 0)}" data-field="groups.0.count" /></label><label class="field"><span>count_type</span><select data-field="groups.0.countType">${options(['exact', 'lower_bound', 'indefinite'], getValue(annotation, 'groups.0.countType', 'exact'))}</select></label></div><label class="field"><span>members</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.members', ''))}" data-field="groups.0.members" /></label><label class="field"><span>shared_states</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.sharedStates', ''))}" data-field="groups.0.sharedStates" /></label></section></div>`;
  }

  function renderEventPanel(annotation) {
    return `<section class="annotation-block structured-block"><div class="structured-block-head"><div><strong>EVENT 事件编辑</strong><small>事件是多个实体围绕同一活动形成的高层语义单元</small></div>${UI.button('+ EVENT', { action: 'toast', className: 'btn-sm' })}</div><div class="review-chip-row"><button class="review-chip active">EV1 · ${UI.escapeHtml(getValue(annotation, 'events.0.type', '事件'))}</button></div><div class="field-grid"><label class="field"><span>Event ID</span><input value="${UI.escapeHtml(getValue(annotation, 'events.0.id', 'EV1'))}" data-field="events.0.id" /></label><label class="field"><span>Family</span><select data-field="events.0.family">${options(['PERFORMANCE', 'BANQUET', 'PROCESSION', 'LABOR', 'RELIGION', 'OTHER'], getValue(annotation, 'events.0.family', 'PERFORMANCE'))}</select></label><label class="field"><span>Event Type</span><input value="${UI.escapeHtml(getValue(annotation, 'events.0.type', ''))}" data-field="events.0.type" /></label><label class="field"><span>Certainty</span><select data-field="events.0.certainty">${options(Data.taxonomy.certainty.map((item) => item.code), getValue(annotation, 'events.0.certainty', 'certain'))}</select></label></div><label class="field"><span>Region（可选）</span><input placeholder="如 R1 / upper_region" value="${UI.escapeHtml(getValue(annotation, 'events.0.region', ''))}" data-field="events.0.region" /></label><label class="field"><span>Participants / Roles</span><textarea rows="2" data-field="events.0.participants">${UI.escapeHtml(getValue(annotation, 'events.0.participants', ''))}</textarea></label><div class="structured-actions"><button class="btn btn-danger" data-action="toast">删除 EVENT</button>${UI.button('保存 EVENT', { action: 'save-annotation', variant: 'primary' })}</div></section>`;
  }

  function renderGroupPanel(annotation) {
    return `<section class="annotation-block structured-block"><div class="structured-block-head"><div><strong>GROUP 群组编辑</strong><small>多个实体被共同描述时建立 Group，并支持嵌套</small></div>${UI.button('+ GROUP', { action: 'toast', className: 'btn-sm' })}</div><div class="review-chip-row"><button class="review-chip active">${UI.escapeHtml(getValue(annotation, 'groups.0.id', 'G1'))} · ${UI.escapeHtml(getValue(annotation, 'groups.0.type', '群组'))}</button></div><div class="field-grid"><label class="field"><span>Group ID</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.id', 'G1'))}" data-field="groups.0.id" /></label><label class="field"><span>Group Type</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.type', ''))}" data-field="groups.0.type" /></label><label class="field"><span>Count</span><input type="number" value="${getValue(annotation, 'groups.0.count', 0)}" data-field="groups.0.count" /></label><label class="field"><span>Count Type</span><select data-field="groups.0.countType">${options(['exact', 'lower_bound', 'indefinite'], getValue(annotation, 'groups.0.countType', 'exact'))}</select></label></div><label class="field"><span>Members</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.members', ''))}" data-field="groups.0.members" /></label><label class="field"><span>Shared States / Actions</span><input value="${UI.escapeHtml(getValue(annotation, 'groups.0.sharedStates', ''))}" data-field="groups.0.sharedStates" /></label><div class="structured-actions"><button class="btn btn-danger" data-action="toast">删除 GROUP</button>${UI.button('保存 GROUP', { action: 'save-annotation', variant: 'primary' })}</div></section>`;
  }

  function renderEntity(annotation) {
    const entities = annotation.entities || [];
    const entityIndex = Math.max(0, Math.min(Number(state().selectedEntityIndex || 0), Math.max(0, entities.length - 1)));
    const entityPath = `entities.${entityIndex}`;
    const baseCode = getValue(annotation, `${entityPath}.baseCategory`, Data.taxonomy.entityTree[0].code);
    const baseNode = Data.taxonomy.entityTree.find((item) => item.code === baseCode) || Data.taxonomy.entityTree[0];
    const subCode = getValue(annotation, `${entityPath}.subCategory`, baseNode.children[0].code);
    const subNode = baseNode.children.find((item) => item.code === subCode) || baseNode.children[0];
    const fineCode = getValue(annotation, `${entityPath}.fineCategory`, subNode.children[0].code);
    const fineNode = subNode.children.find((item) => item.code === fineCode) || subNode.children[0];
    const entityChips = entities.map((entity, index) => `<button class="review-chip ${index === entityIndex ? 'active' : ''}" data-action="select-entity-box" data-index="${index}">${UI.escapeHtml(entity.id)} · ${UI.escapeHtml(entityDisplayName(entity))}</button>`).join('');
    return `<section class="annotation-block entity-editor"><div class="structured-block-head"><div><strong>Entity 实体</strong><small>严格按教程：一级分类 → 二级分类 → 三级分类</small></div>${UI.button('+ 实体', { action: 'toggle-draw-box', className: 'btn-sm' })}</div><div class="review-chip-row">${entityChips}</div>${entities.length > 1 ? `<div class="entity-chip-actions">${UI.button('删除当前实体', { action: 'delete-entity-box', variant: 'danger', className: 'btn-sm' })}</div>` : ''}<div class="field-grid"><label class="field"><span>一级分类 *</span><select data-entity-level="1" data-field="${entityPath}.baseCategory">${options(Data.taxonomy.entityTree.map((item) => item.code), baseNode.code, (item) => { const node = Data.taxonomy.entityTree.find((entry) => entry.code === item); return `${node.code} · ${node.label}`; })}</select></label><label class="field"><span>二级分类 *</span><select data-entity-level="2" data-field="${entityPath}.subCategory">${options(baseNode.children.map((item) => item.code), subNode.code, (item) => { const node = baseNode.children.find((entry) => entry.code === item); return `${node.code} · ${node.label}`; })}</select></label><label class="field"><span>三级分类 *</span><select data-entity-level="3" data-field="${entityPath}.fineCategory">${options(subNode.children.map((item) => item.code), fineNode.code, (item) => { const node = subNode.children.find((entry) => entry.code === item); return `${node.code} · ${node.label}`; })}</select></label><label class="field"><span>normalized_value</span><input value="${UI.escapeHtml(getValue(annotation, `${entityPath}.normalizedValue`, fineNode.label))}" data-field="${entityPath}.normalizedValue" /></label><label class="field"><span>certainty</span><select data-field="${entityPath}.certainty">${options(Data.taxonomy.certainty.map((item) => item.code), getValue(annotation, `${entityPath}.certainty`, 'certain'))}</select></label><label class="field"><span>visibility</span><select data-field="${entityPath}.visibility">${options(Data.taxonomy.visibility, getValue(annotation, `${entityPath}.visibility`, 'clear'))}</select></label><label class="field"><span>evidence</span><input value="${UI.escapeHtml(getValue(annotation, `${entityPath}.evidence`, ''))}" data-field="${entityPath}.evidence" /></label></div><div class="category-path"><span>${UI.escapeHtml(baseNode.label)}</span><b>›</b><span>${UI.escapeHtml(subNode.label)}</span><b>›</b><span>${UI.escapeHtml(fineNode.label)}</span></div><div class="bbox-grid">${bboxInputs(annotation, `${entityPath}.bbox`)}</div><div class="tag-picker-grid">${renderTagPicker(annotation, entityIndex, 'attributes', 'Attribute 属性', Data.taxonomy.attributes)}${renderTagPicker(annotation, entityIndex, 'states', 'State 状态', Data.taxonomy.states)}${renderTagPicker(annotation, entityIndex, 'actions', 'Action 动作', Data.taxonomy.actions)}</div></section>`;
  }

  function renderRelation(annotation) {
    const customRelations = (state().customTags && state().customTags.relations) || [];
    const relationOptions = Data.taxonomy.relationFamilies.map((family) => `<optgroup label="${family.key} · ${family.label}">${family.types.map((type) => option(type, getValue(annotation, 'relations.0.type', 'beside'), type)).join('')}</optgroup>`).join('') + (customRelations.length ? `<optgroup label="CUSTOM · 人工标签">${customRelations.map((type) => option(type, getValue(annotation, 'relations.0.type', 'beside'), type)).join('')}</optgroup>` : '');
    return `<section class="annotation-block relation-editor"><div class="annotation-title"><span>R</span><div><strong>Relation 关系</strong><small>按 SPATIAL / MEMBERSHIP / INTERACTION / NARRATIVE / TEXT 五族共 43 类维护</small></div></div><div class="field-grid four-fields"><label class="field"><span>id</span><input value="${UI.escapeHtml(getValue(annotation, 'relations.0.id', 'REL1'))}" data-field="relations.0.id" /></label><label class="field"><span>family</span><select data-field="relations.0.family">${options(Data.taxonomy.relationFamilies.map((item) => item.key).concat(['CUSTOM']), getValue(annotation, 'relations.0.family', 'SPATIAL'))}</select></label><label class="field"><span>relation_type</span><select data-field="relations.0.type">${relationOptions}</select></label><label class="field"><span>certainty</span><select data-field="relations.0.certainty">${options(Data.taxonomy.certainty.map((item) => item.code), getValue(annotation, 'relations.0.certainty', 'certain'))}</select></label><label class="field"><span>source</span><input value="${UI.escapeHtml(getValue(annotation, 'relations.0.source', ''))}" data-field="relations.0.source" /></label><label class="field"><span>target</span><input value="${UI.escapeHtml(getValue(annotation, 'relations.0.target', ''))}" data-field="relations.0.target" /></label><label class="field span-two"><span>evidence</span><input value="${UI.escapeHtml(getValue(annotation, 'relations.0.evidence', ''))}" data-field="relations.0.evidence" /></label></div></section>`;
  }

  function render() {
    const role = state().role === 'expert' ? 'expert' : 'reviewer';
    const workbench = Data.workbench[role] || Data.workbench.reviewer;
    const selectedId = state().selectedSample || workbench.queue[0].id;
    const selected = Data.samples.find((item) => item.id === selectedId) || Data.samples[0];
    const annotation = state().annotationDraft || Data.annotationEditor;
    const entities = annotation.entities || [];
    const selectedEntityIndex = Math.max(0, Math.min(Number(state().selectedEntityIndex || 0), Math.max(0, entities.length - 1)));
    const selectedEntity = entities[selectedEntityIndex] || { bbox: [0, 0, 0, 0] };
    const tabs = [
      { key: 'scene', label: 'Scene' },
      { key: 'entity', label: 'Entity' },
      { key: 'group', label: 'GROUP' },
      { key: 'event', label: 'EVENT' },
      { key: 'relation', label: 'Relation' }
    ];
    const activeTab = tabs.some((tab) => tab.key === state().workbenchTab) ? state().workbenchTab : 'entity';
    const panels = {
      scene: () => renderSceneRegion(annotation),
      entity: () => renderEntity(annotation),
      group: () => renderGroupPanel(annotation),
      event: () => renderEventPanel(annotation),
      relation: () => renderRelation(annotation)
    };
    const tabsMarkup = tabs.map((tab) => `<button class="${tab.key === activeTab ? 'active' : ''}" data-action="switch-workbench-tab" data-tab="${tab.key}">${tab.label}</button>`).join('');
    const bboxMarkup = entities.map((entity, index) => {
      const box = entity.bbox || [0, 0, 100, 100];
      const left = Math.min(Number(box[0]) || 0, Number(box[2]) || 0) / 10;
      const top = Math.min(Number(box[1]) || 0, Number(box[3]) || 0) / 10;
      const width = Math.abs((Number(box[2]) || 0) - (Number(box[0]) || 0)) / 10;
      const height = Math.abs((Number(box[3]) || 0) - (Number(box[1]) || 0)) / 10;
      return `<button class="bbox ${index === selectedEntityIndex ? 'selected' : ''}" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" data-action="select-entity-box" data-index="${index}"><span>${UI.escapeHtml(entity.id)} · ${UI.escapeHtml(entityDisplayName(entity))}</span></button>`;
    }).join('');
    const image = state().uploadedImagePreview ? `<img src="${state().uploadedImagePreview}" alt="上传的壁画样例" />` : UI.muralThumb(selected, 'large');
    const meta = [
      ['壁画 ID', state().uploadedSampleId || selected.id],
      ['名称', selected.title],
      ['当前角色', role === 'expert' ? '专家审核员' : '标注审核员'],
      ['Candidate', state().annotationJob ? 'v1' : 'v3']
    ];
    const roles = ['AI 自动标注', 'Reviewer 审核员', 'Expert 专家审核员', 'Admin 管理员验收'];
    return `${UI.pageHeader('人工审核与校正', '左侧为壁画与 BBox；右侧统一完成 Scene、Entity、GROUP、EVENT、Relation 的结构化审核。', `${UI.button('重新运行 AI', { action: 'rerun-ai' })}${UI.button('保存草稿', { action: 'save-annotation', icon: 'save' })}${UI.button('预览 JSON', { action: 'preview-json' })}${UI.button('提交专家复核（先检查）', { action: 'submit-review', variant: 'primary', icon: 'check' })}`)}<section class="review-meta-grid">${meta.map(([label, value]) => `<article><span>${UI.escapeHtml(label)}</span><strong>${UI.escapeHtml(value)}</strong></article>`).join('')}</section><section class="card task-review-strip"><div class="task-review-title"><div><strong>TASK-001 · ${UI.escapeHtml(selected.title)} AI 结果审核</strong><p>审核员：reviewer_01 · 专家：expert_01 · 截止：2026-10-15</p></div>${UI.badge('审核中', 'expert-review')}</div><div class="role-progress">${roles.map((label, index) => `<div class="${index < 2 ? 'active' : ''}"><span>${index + 1}</span><strong>${UI.escapeHtml(label)}</strong></div>`).join('')}</div></section><div class="review-workspace"><section class="card image-review-panel"><div class="panel-title-row"><div><strong>壁画图像 / BBox 校正</strong><span>普通模式</span></div><small>当前框：${UI.escapeHtml(selectedEntity.id || 'E1')} [${(selectedEntity.bbox || []).join(', ')}]</small></div><div class="bbox-toolbar">${UI.button('绘制新 BBox', { action: 'toggle-draw-box', variant: state().drawBoxMode ? 'primary' : 'secondary', icon: 'plus' })}${UI.button('重置 AI 框', { action: 'reset-bboxes' })}${UI.button('删除 BBox', { action: 'delete-entity-box', variant: 'danger' })}</div><div class="review-canvas ${state().drawBoxMode ? 'draw-mode' : ''}"><div id="mural-canvas" class="canvas-media">${image}${bboxMarkup}</div></div><div class="caption-panel"><span>Caption</span><p>${UI.escapeHtml(selected.caption)}</p></div><div class="structure-summary"><div><strong>当前结构摘要</strong><span>五层语义结构</span></div><div class="structure-pills"><span>Scene 3</span><b>→</b><span>Entity ${entities.length}</span><b>→</b><span>GROUP ${(annotation.groups || []).length}</span><b>→</b><span>EVENT ${(annotation.events || []).length}</span><b>→</b><span>Relation ${(annotation.relations || []).length}</span></div></div></section><section class="card structured-review-panel"><div class="panel-title-row"><div><strong>结构化审核面板</strong></div>${UI.badge('审核', 'ai-ready')}</div><div class="review-tabs">${tabsMarkup}</div><div class="review-tab-content">${panels[activeTab]()}</div></section></div>`;
  }

  function sectionTitle(title, subtitle, extra) {
    return `<div class="section-head"><div><h2>${UI.escapeHtml(title)}</h2>${subtitle ? `<p>${UI.escapeHtml(subtitle)}</p>` : ''}</div>${extra || ''}</div>`;
  }

  window.WorkbenchPage = { render };
})();

















