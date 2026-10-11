/* ==========================================================================
   壁画结构化语义标注系统 · 共享状态 / UI / 后端同步层
   - 角色与导航：APP.roles、getRole、shell
   - 状态读写：localStorage + 后端镜像（bootstrapSync / syncState）
   - 标注体系 / 关系 / 场景 / 工作流 / 用户角色等默认值与读写
   TODO: 逐个填实（函数签名已定，实现待填）。
   ========================================================================== */

/* ---------- 全局应用配置（角色 / 页面 / 导航） ---------- */
const APP = {
  roles: {
    /* TODO: 填实各角色配置，例如：
    admin: {
      name: '管理员', user: 'admin_01',
      pages: [...], nav: [...]
    },
    reviewer: { ... }, expert: { ... }, researcher: { ... }
    */
  },
};

/* ---------- 角色与导航 ---------- */
function getRole() { /* TODO: 返回 localStorage['mural_role'] || 'admin' */ throw new Error("TODO"); }
function setRole(r) { /* TODO: 写入角色并刷新 */ throw new Error("TODO"); }
function shell() { /* TODO: 按角色渲染顶栏 + 侧边导航，做页面级权限拦截 */ throw new Error("TODO"); }

/* ---------- 通用 UI ---------- */
function toast(msg) { /* TODO: 顶部提示气泡 */ throw new Error("TODO"); }
function openModal(id) { /* TODO: 显示弹窗 */ throw new Error("TODO"); }
function closeModal(id) { /* TODO: 隐藏弹窗 */ throw new Error("TODO"); }
function confirmAction(msg, redirect) { /* TODO: 确认后跳转 */ throw new Error("TODO"); }
function downloadText(filename, text) { /* TODO: 触发文本下载 */ throw new Error("TODO"); }

/* ---------- 后端同步层（启动灌入 / 保存镜像，失败降级 localStorage） ---------- */
async function bootstrapSync() {
  /* TODO: GET /api/bootstrap → 全量写入 localStorage；失败静默降级纯本地模式 */
  throw new Error("TODO");
}
async function syncState(key, value) {
  /* TODO: POST /api/state/{key} 镜像到后端；失败静默降级 */
  throw new Error("TODO");
}

/* ---------- 示例壁画 meta ---------- */
function getSampleMeta() { /* TODO */ throw new Error("TODO"); }
function setSampleMeta(meta) { /* TODO */ throw new Error("TODO"); }

/* ---------- 审核草稿（review_draft） ---------- */
function getReviewDraft() { /* TODO */ throw new Error("TODO"); }
function saveReviewDraft(d) { /* TODO: 写 localStorage + syncState('review_draft_v3', d) */ throw new Error("TODO"); }
function normalizeReviewDraftV6() { /* TODO: 结构归一化 */ throw new Error("TODO"); }
function normalizeReviewDraftV7() { /* TODO: 结构归一化 */ throw new Error("TODO"); }

/* ---------- 标注体系（taxonomy） ---------- */
function defaultAnnotationTaxonomy() { /* TODO: 返回默认体系 */ throw new Error("TODO"); }
function getAnnotationTaxonomy() { /* TODO */ throw new Error("TODO"); }
function saveAnnotationTaxonomy(t) { /* TODO */ throw new Error("TODO"); }
function taxChildren(parent) { /* TODO: 返回子词条 */ throw new Error("TODO"); }
function taxTerm(id) { /* TODO: 按 id 查词条 */ throw new Error("TODO"); }
function taxRootOf(id) { /* TODO: 返回词条根节点 */ throw new Error("TODO"); }
function factSchemasFor(baseId, kind) { /* TODO: 返回可填事实模板 */ throw new Error("TODO"); }

/* ---------- 场景 / 关系体系 ---------- */
function getSceneHierarchy() { /* TODO: 返回一级场景树 */ throw new Error("TODO"); }
function getRelationTaxonomy() { /* TODO: 返回关系五家族 */ throw new Error("TODO"); }

/* ---------- 叙事示例 ---------- */
function getNarrativeDemo() { /* TODO */ throw new Error("TODO"); }
function saveNarrativeDemo(d) { /* TODO */ throw new Error("TODO"); }

/* ---------- 工作流任务 ---------- */
function defaultWorkflowTasks() { /* TODO */ throw new Error("TODO"); }
function getWorkflowTasks() { /* TODO */ throw new Error("TODO"); }
function saveWorkflowTasks(t) { /* TODO */ throw new Error("TODO"); }
function currentUser() { /* TODO */ throw new Error("TODO"); }
function currentTask() { /* TODO */ throw new Error("TODO"); }
function setActiveTask(id) { /* TODO */ throw new Error("TODO"); }
function taskStatusLabel(s) { /* TODO: 状态码 → 中文标签 */ throw new Error("TODO"); }
function workflowStageIndex(status) { /* TODO: 状态 → 阶段序号 */ throw new Error("TODO"); }
function renderWorkflowStrip(status) { /* TODO: 渲染进度条 */ throw new Error("TODO"); }

/* ---------- 用户与角色 ---------- */
function defaultUsers() { /* TODO */ throw new Error("TODO"); }
function getUsers() { /* TODO */ throw new Error("TODO"); }
function saveUsers(v) { /* TODO */ throw new Error("TODO"); }
function defaultRoles() { /* TODO */ throw new Error("TODO"); }
function getRoles() { /* TODO */ throw new Error("TODO"); }

/* ---------- 页面启动引导 ---------- */
/* TODO: 每页 <script> 尾部调用 shell() + bootstrapSync() 完成初始化 */
