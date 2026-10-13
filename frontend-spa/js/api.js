/**
 * 数据访问层。
 * 真实模式按《后端接口对接说明书》请求 http://127.0.0.1:8000/api。
 * 本地无后端演示时在地址后增加 ?mock=1。
 */
(function () {
  const config = window.APP_CONFIG || { apiBase: 'http://127.0.0.1:8000/api', useMock: false };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const wait = (value, delay = 90) => new Promise((resolve) => window.setTimeout(() => resolve(clone(value)), delay));

  function unwrap(payload) {
    if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'code')) {
      if (Number(payload.code) !== 0) throw new Error(payload.msg || `接口返回错误：${payload.code}`);
      return payload.data;
    }
    return payload;
  }

  async function request(path, options) {
    const opts = options || {};
    if (config.useMock && Object.prototype.hasOwnProperty.call(opts, 'mockValue')) return wait(opts.mockValue);
    const headers = Object.assign({}, opts.headers || {});
    if (!(opts.body instanceof FormData) && opts.body != null) headers['Content-Type'] = 'application/json';
    let response;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    try {
      response = await fetch(`${config.apiBase}${path}`, {
        method: opts.method || 'GET',
        headers,
        signal: controller.signal,
        body: opts.body instanceof FormData ? opts.body : (opts.body == null ? undefined : JSON.stringify(opts.body))
      });
    } catch (error) {
      if (Object.prototype.hasOwnProperty.call(opts, 'mockValue')) {
        window.APP_CONFIG.usingFallback = true;
        return wait(opts.mockValue);
      }
      throw new Error(`无法连接后端 ${config.apiBase}。请确认后端服务已启动，或使用 ?mock=1 进入种子数据模式。`);
    }
    window.clearTimeout(timer);
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch (error) { payload = text; }
    }
    if (!response.ok) {
      const message = payload && typeof payload === 'object' ? (payload.msg || payload.detail) : payload;
      throw new Error(message || `请求失败：${response.status}`);
    }
    return unwrap(payload);
  }

  window.API = {
    isMock: config.useMock,
    request,

    login(username, password) {
      return request('/login', {
        method: 'POST',
        body: { username, password },
        mockValue: { username, role: username === 'admin' ? '管理员' : '标注员' }
      });
    },

    uploadSample(file) {
      const form = new FormData();
      form.append('file', file);
      return request('/samples/upload', {
        method: 'POST',
        body: form,
        mockValue: { sample_id: 'S-' + String(Date.now()).slice(-7), filename: file.name }
      });
    },

    annotateSample(sampleId) {
      return request(`/samples/${encodeURIComponent(sampleId)}/annotate`, {
        method: 'POST',
        mockValue: { annotation_id: `ANN-${sampleId}`, result: window.MockData.annotationEditor }
      });
    },

    startAnnotation(sampleId) {
      return this.annotateSample(sampleId);
    },

    saveAnnotation(annotationId, content) {
      if (annotationId && typeof annotationId === 'object') {
        const legacy = annotationId;
        return request('/annotations/' + encodeURIComponent(legacy.sampleId), {
          method: 'PUT', body: { content: legacy.annotation },
          mockValue: { annotation_id: `ANN-${legacy.sampleId}`, version: 2 }
        });
      }
      return request(`/annotations/${encodeURIComponent(annotationId)}`, {
        method: 'PUT',
        body: { content },
        mockValue: { annotation_id: annotationId, version: 2 }
      });
    },

    getAnnotationVersions(annotationId) {
      return request(`/annotations/${encodeURIComponent(annotationId)}/versions`, {
        mockValue: window.MockData.audit.versions
      });
    },

    rollbackAnnotation(annotationId, targetVersion) {
      return request(`/annotations/${encodeURIComponent(annotationId)}/rollback?target_version=${encodeURIComponent(targetVersion)}`, {
        method: 'POST',
        mockValue: { current_version: Number(targetVersion) + 1 }
      });
    },

    exportAnnotation(annotationId) {
      return request(`/annotations/${encodeURIComponent(annotationId)}/export`, {
        mockValue: { annotation_id: annotationId, version: 3, content: window.MockData.annotationEditor }
      });
    },

    getOverview() { return request('/overview', { mockValue: window.MockData.overview }); },
    getSamples() { return request('/samples', { mockValue: window.MockData.samples }); },
    getAssignmentData() { return request('/assignments/options', { mockValue: window.MockData.assignment }); },
    getAiTasks() { return request('/ai-tasks', { mockValue: window.MockData.aiTasks }); },
    getWorkflow() { return request('/workflow', { mockValue: window.MockData.workflow }); },
    getTaxonomy() { return request('/taxonomy', { mockValue: window.MockData.taxonomy }); },
    getAiConfig() { return request('/ai-config', { mockValue: window.MockData.aiConfig }); },
    getQualityRules() { return request('/quality-rules', { mockValue: window.MockData.qualityRules }); },
    getUsers() { return request('/users', { mockValue: window.MockData.users }); },
    getAudit() { return request('/audit', { mockValue: window.MockData.audit }); },
    getExports() { return request('/exports', { mockValue: window.MockData.exports }); },
    getWorkbench(roleId) { return request(`/workbench?role=${encodeURIComponent(roleId)}`, { mockValue: window.MockData.workbench[roleId] || window.MockData.workbench.reviewer }); },
    getTasks(roleId) { return request(`/tasks?role=${encodeURIComponent(roleId)}`, { mockValue: window.MockData.tasks[roleId] || window.MockData.tasks.reviewer }); },
    getRecords() { return request('/review-records', { mockValue: window.MockData.records }); },

    createAssignment(payload) { return request('/assignments', { method: 'POST', body: payload, mockValue: { ok: true, taskId: `TASK-${Date.now()}` } }); },
    saveWorkflow(payload) { return request('/workflow', { method: 'PUT', body: payload, mockValue: { ok: true } }); },
    saveTaxonomy(payload) { return request('/taxonomy', { method: 'POST', body: payload, mockValue: { ok: true, version: 'v1.2-custom' } }); },
    publishAiConfig(payload) { return request('/ai-config/publish', { method: 'POST', body: payload, mockValue: { ok: true } }); },
    updateQualityRule(payload) { return request('/quality-rules', { method: 'PUT', body: payload, mockValue: { ok: true } }); },
    updateUser(payload) { return request('/users', { method: 'PUT', body: payload, mockValue: { ok: true } }); },

    async downloadExport(type) {
      const payload = {
        schemaVersion: '1.1',
        exportType: type,
        records: window.MockData.samples.filter((sample) => type === 'gold' ? sample.status === 'APPROVED' : true)
      };
      return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    }
  };
})();



