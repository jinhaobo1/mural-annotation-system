# frontend

19 个 HTML 页面 + `assets/`（共享样式 `shared.css`、共享状态/同步层 `shared.js`）。

- 页面结构与样式在 `assets/shared.css` 统一维护
- 状态读写与后端同步在 `assets/shared.js`：启动时 `GET /api/bootstrap` 灌入 localStorage，
  每次保存 `POST /api/state/{key}` 镜像到后端
- 后端不可达时前端自动退回纯 localStorage 模式

> 本骨架中各页面为最小结构，`shared.js` 仅保留函数签名（`// TODO` 占位），实现待填。
