/** 通用 UI 组件与格式化工具。 */
(function () {
  const ICONS = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    samples: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
    assignment: '<path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-5"/>',
    "ai-tasks": '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    workflow: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6.3 7.7l4.5 8.4M17.7 7.7l-4.5 8.4"/>',
    taxonomy: '<path d="M12 3v5M12 8 6 12M12 8l6 4M6 12v5M18 12v5"/><circle cx="12" cy="3" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    "ai-config": '<path d="M4 6h5M13 6h7M4 12h10M18 12h2M4 18h2M10 18h10"/><circle cx="11" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    quality: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    audit: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    workbench: '<path d="M4 4h16v12H4z"/><path d="M8 20h8M12 16v4"/><path d="m8 12 3-3 2 2 3-4"/>',
    "my-tasks": '<path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 13h8M8 17h5"/>',
    "review-records": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    lock: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    play: '<path d="m8 5 11 7-11 7Z"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"`]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '`': '&#96;' }[char]));
  }

  function icon(name, size) {
    return `<svg class="icon" width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  function button(label, options) {
    const opts = options || {};
    const attrs = [
      `class="btn ${opts.variant || 'secondary'} ${opts.className || ''}"`,
      opts.action ? `data-action="${opts.action}"` : '',
      opts.route ? `data-route="${opts.route}"` : '',
      opts.type ? `type="${opts.type}"` : 'type="button"',
      opts.disabled ? 'disabled' : '',
      opts.title ? `title="${escapeHtml(opts.title)}"` : ''
    ].filter(Boolean).join(' ');
    return `<button ${attrs}>${opts.icon ? icon(opts.icon, opts.iconSize || 16) : ''}<span>${escapeHtml(label)}</span></button>`;
  }

  function pageHeader(title, description, actions) {
    return `<div class="page-head"><div><h1>${escapeHtml(title)}</h1><p>${description || ''}</p></div><div class="page-actions">${actions || ''}</div></div>`;
  }

  function badge(label, level) {
    const normalized = String(level || label).toLowerCase().replace(/_/g, '-');
    return `<span class="badge badge-${escapeHtml(normalized)}">${escapeHtml(label)}</span>`;
  }

  function statusBadge(status) {
    const labels = {
      AI_READY: 'AI_READY', RAW_READY: 'RAW_READY', APPROVED: 'APPROVED', RUNNING: 'RUNNING', COMPLETED: 'COMPLETED', FAILED: 'FAILED',
      IN_REVIEW: '审核中', PENDING: '待处理', EXPERT_REVIEW: '专家复核', ADMIN_ACCEPTANCE: '待管理员验收', active: 'active'
    };
    return badge(labels[status] || status, status);
  }

  function statCard(item) {
    return `<article class="stat-card"><div class="stat-label">${escapeHtml(item.label)}</div><div class="stat-value ${item.tone || ''}">${escapeHtml(item.value)}</div><div class="stat-hint">${escapeHtml(item.hint || '')}</div></article>`;
  }

  function progress(value, text) {
    return `<div class="progress-wrap"><div class="progress-track"><span style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></span></div><small>${escapeHtml(text || `${value}%`)}</small></div>`;
  }

  function muralThumb(item, size) {
    const label = item && item.title ? item.title.slice(0, 2) : '壁画';
    const accent = item && item.accent ? item.accent : 'ochre';
    if (item && item.image_url) {
      return `<div class="mural-thumb mural-${escapeHtml(accent)} has-image ${size === 'large' ? 'mural-large' : ''}"><img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || '壁画')}" loading="lazy" /></div>`;
    }
    return `<div class="mural-thumb mural-${escapeHtml(accent)} ${size === 'large' ? 'mural-large' : ''}"><span>${escapeHtml(label)}</span><i></i></div>`;
  }

  function emptyState(title, description) {
    return `<div class="empty-state"><div class="empty-icon">${icon('info', 28)}</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description || '')}</p></div>`;
  }

  window.UI = { icon, escapeHtml, button, pageHeader, badge, statusBadge, statCard, progress, muralThumb, emptyState };
})();

