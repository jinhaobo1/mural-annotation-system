/**
 * 前端权限与路由配置。
 * 权限以路由 key 为单位维护，导航只渲染当前角色已授权的项目。
 */
(function () {
  const ROUTES = {
    overview: { title: "项目概览", shortTitle: "项目概览", group: "项目管理", nav: true, description: "项目数据、任务进度与验收概况" },
    samples: { title: "壁画数据", shortTitle: "壁画数据", group: "项目管理", nav: true, description: "壁画样本、AI 结果与版本状态" },
    assignment: { title: "任务分配", shortTitle: "任务分配", group: "项目管理", nav: true, description: "将 AI_READY 样本分配给审核人员" },
    "ai-tasks": { title: "AI 任务中心", shortTitle: "AI任务中心", group: "项目管理", nav: true, description: "单张 Run 与批量 Batch 的任务监控" },
    workflow: { title: "标注工作流", shortTitle: "标注工作流", group: "项目管理", nav: true, description: "配置从 AI 自动标注到最终验收的流程规则" },
    taxonomy: { title: "自定义标注体系", shortTitle: "标注体系", group: "配置中心", nav: true, description: "维护实体、场景、事件、关系与属性词表" },
    "ai-config": { title: "AI 配置管理", shortTitle: "AI配置", group: "配置中心", nav: true, description: "配置 AI Pipeline、模型、Prompt 与阈值" },
    quality: { title: "质检规则", shortTitle: "质检规则", group: "配置中心", nav: true, description: "配置 BLOCKING / WARNING / INFO 质检规则" },
    users: { title: "用户与角色", shortTitle: "用户与角色", group: "配置中心", nav: true, description: "管理系统用户、角色以及角色权限" },
    audit: { title: "版本与审计", shortTitle: "版本与审计", group: "数据治理", nav: true, description: "查看版本谱系、版本对比与全链路操作日志" },
    export: { title: "数据导出", shortTitle: "数据导出", group: "数据治理", nav: true, description: "导出 Gold、Reviewed、AI Pseudo 与 Feedback 数据" },
    workbench: { title: "标注工作台", shortTitle: "标注工作台", group: "我的工作", nav: true, description: "上传样例、查看五层标注结果并完成人工修正" },
    "my-tasks": { title: "我的任务", shortTitle: "我的任务", group: "我的工作", nav: true, description: "当前角色被分配的待处理任务" },
    "review-records": { title: "我的审核记录", shortTitle: "我的审核记录", group: "记录", nav: true, description: "当前角色已完成的审核与验收记录" }
  };

  const ROLE_DEFINITIONS = {
    admin: {
      id: "admin", label: "管理员", username: "admin_01", badge: "管", home: "overview", tone: "blue",
      description: "负责数据、AI 任务、任务分配、工作流与最终验收入库",
      permissions: ["overview", "samples", "assignment", "ai-tasks", "workflow", "taxonomy", "ai-config", "quality", "users", "audit", "export"]
    },
    reviewer: {
      id: "reviewer", label: "标注审核员", username: "reviewer_01", badge: "审", home: "workbench", tone: "cyan",
      description: "处理分配给自己的样本，完成标注校正与提交",
      permissions: ["workbench", "my-tasks", "review-records"]
    },
    expert: {
      id: "expert", label: "专家审核员", username: "expert_01", badge: "专", home: "workbench", tone: "violet",
      description: "复核专业身份、复杂叙事、不确定术语与跨模态冲突",
      permissions: ["workbench", "my-tasks", "review-records"]
    },
    researcher: {
      id: "researcher", label: "只读研究员", username: "researcher_01", badge: "研", home: "overview", tone: "green",
      description: "只读浏览项目概况、样本与标注体系，不允许修改数据",
      permissions: ["overview", "samples", "taxonomy"]
    }
  };

  const ROLE_NAVIGATION = {
    admin: [
      { label: "项目管理", items: ["overview", "samples", "assignment", "ai-tasks", "workflow"] },
      { label: "配置中心", items: ["taxonomy", "ai-config", "quality", "users"] },
      { label: "数据治理", items: ["audit", "export"] }
    ],
    reviewer: [
      { label: "我的工作", items: ["workbench", "my-tasks"] },
      { label: "记录", items: ["review-records"] }
    ],
    expert: [
      { label: "我的工作", items: ["workbench", "my-tasks"] },
      { label: "记录", items: ["review-records"] }
    ],
    researcher: [
      { label: "项目浏览", items: ["overview", "samples"] },
      { label: "知识体系", items: ["taxonomy"] }
    ]
  };

  const STORAGE_KEY = "mural-role-permission-overrides";
  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (error) { overrides = {}; }

  function permissionsFor(roleId) {
    const role = ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.admin;
    return Array.isArray(overrides[roleId]) ? overrides[roleId] : role.permissions.slice();
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides)); } catch (error) { /* 文件预览模式允许忽略 */ }
  }

  const PermissionConfig = {
    routes: ROUTES,
    roles: ROLE_DEFINITIONS,
    navigation: ROLE_NAVIGATION,
    getRole(roleId) {
      const role = ROLE_DEFINITIONS[roleId] || ROLE_DEFINITIONS.admin;
      return Object.assign({}, role, { permissions: permissionsFor(role.id) });
    },
    getAllRoles() { return Object.keys(ROLE_DEFINITIONS).map((key) => PermissionConfig.getRole(key)); },
    canAccess(roleId, routeKey) { return permissionsFor(roleId).includes(routeKey); },
    setRolePermissions(roleId, permissions) {
      if (!ROLE_DEFINITIONS[roleId]) return;
      overrides[roleId] = Array.from(new Set(permissions.filter((key) => ROUTES[key])));
      persist();
    },
    resetRolePermissions(roleId) {
      if (roleId) delete overrides[roleId];
      else overrides = {};
      persist();
    },
    getVisibleNavigation(roleId) {
      const groups = ROLE_NAVIGATION[roleId] || ROLE_NAVIGATION.admin;
      return groups.map((group) => ({
        label: group.label,
        items: group.items.filter((routeKey) => PermissionConfig.canAccess(roleId, routeKey) && ROUTES[routeKey] && ROUTES[routeKey].nav)
      })).filter((group) => group.items.length);
    },
    getHiddenCount(roleId) {
      return Object.keys(ROUTES).filter((key) => ROUTES[key].nav && !PermissionConfig.canAccess(roleId, key)).length;
    }
  };

  window.PermissionConfig = PermissionConfig;
})();

