# 壁画结构化语义标注系统 · 前端

本目录对应任务分工中的 **B 乙（李鹏祥）** 前端范围，采用零依赖单页应用实现，双击 `index.html` 即可运行，不需要安装 Node.js 或命令行环境。

## 已实现

- 14 个路由页面：项目概览、壁画数据、任务分配、AI 任务中心、标注工作流、标注体系、AI 配置、质检规则、用户与角色、版本与审计、数据导出、标注工作台、我的任务、我的审核记录。
- 角色权限：管理员、标注审核员、专家审核员、只读研究员。
- 无权限模块不会出现在导航栏。
- 直接访问无权限哈希地址、切换身份后当前页失去权限，都会显示拦截提示并返回该身份主页。
- 角色管理页包含权限矩阵，修改后导航栏立即按权限重绘，权限保存到 `localStorage`。
- 工作台包含上传样例图、五层标注结果、人工修改、保存修正、提交专家、导出 JSON 的完整交互闭环。
- 支持人工新增 Attribute、State、Action、Relation 标签，自定义标签跨刷新保留并参与保存与导出。
- 工作台支持在画布上拖拽手动新增 BBox，自动生成实体并进入实体编辑。
- 工作台采用“顶部任务信息 + 左侧壁画/BBox 校正 + 右侧 Scene/Entity/GROUP/EVENT/Relation 审核面板”的截图布局。
- 默认连接联调后端 `http://192.168.197.128:8000/api`；网络不可达时自动回退到本地种子数据。
- 已接入 PDF 提取的 15 张壁画图片和 15 条元数据，作为初始展示数据。
- 无后端演示时访问 `index.html?mock=1`，也可通过 `?api=http://host:8000/api` 临时覆盖后端地址。

## 按教程 V1.0 对齐的内容

- 五层数据结构：`Scene → Region → Event → Group → Entity`。
- Scene 支持多场景 themes；Region 仅在明显分区时建立。
- 实体字段包含 `base_category / sub_category / fine_category / bbox / attributes / states / actions / visibility`。
- 体系包含 11 个一级实体类别、HUMAN 9 个二级类别、14 个一级场景。
- 实体分类按“一级 → 二级 → 三级”联动选择；场景严格按教程的一级、二级层级设计。
- 关系按 5 族共 43 类维护：SPATIAL 15、MEMBERSHIP 4、INTERACTION 9、NARRATIVE 12、TEXT 3。
- certainty 使用四级：`certain / probable / possible / unknown`。
- visibility 使用六级：`clear / partial / occluded / damaged / unclear / missing`。
- 质检页映射教程 8.1 自检清单，共 14 条规则。
- 版本状态为 `raw → ai_candidate → reviewer → expert → admin_approved`，支持版本对比与回滚。

## 运行

直接打开：

```text
frontend/index.html
```

如果浏览器限制本地文件的部分能力，可在项目根目录运行任意静态服务器。未安装 Node.js 时也可以使用 Python：

```powershell
cd frontend
python -m http.server 8080
```

随后访问 `http://127.0.0.1:8080/`。

## 权限速查

| 身份 | 可访问模块 |
| --- | --- |
| 管理员 | 项目管理、配置中心、数据治理共 11 个管理模块 |
| 标注审核员 | 标注工作台、我的任务、我的审核记录 |
| 专家审核员 | 标注工作台、我的任务、我的审核记录 |
| 只读研究员 | 项目概览、壁画数据、标注体系（只读） |

## 关键文件

- `index.html`：应用入口。
- `css/styles.css`：截图对应的深色侧栏、白色卡片、表格和表单样式。
- `js/permissions.js`：路由与角色权限单一事实来源。
- `js/app.js`：导航、路由守卫、身份切换、越权提示和交互委托。
- `js/pages.js`：14 个页面的 HTML 渲染。
- `js/workbench-page.js`：五层标注工作台及 43 类关系编辑。
- `js/api.js`：mock / 真实 API 适配层。
- `js/mock-data.js`：演示数据，后续由 B 甲真实接口替换。

## 接口对接说明

默认按《壁画语义标注系统 · 后端接口对接说明书》连接：

- 基础地址：`http://192.168.197.128:8000/api`
- 统一响应：`{ "code": 0, "data": ..., "msg": "..." }`
- 登录账号：`han / 123`（标注员）、`admin / 123`（管理员）

已接入的 7 个接口：

- `POST /api/login`
- `POST /api/samples/upload`，form-data 字段名 `file`
- `POST /api/samples/{sample_id}/annotate`
- `PUT /api/annotations/{annotation_id}`，请求体 `{ "content": ... }`
- `GET /api/annotations/{annotation_id}/versions`
- `POST /api/annotations/{annotation_id}/rollback?target_version=...`
- `GET /api/annotations/{annotation_id}/export`

Mock 演示模式：

```text
index.html?mock=1
```

## 权限边界说明

前端权限用于控制导航可见性、页面访问和操作体验，不应作为真实安全边界。接入 B 甲 API 后，后端仍需对每个接口再次校验当前登录用户与角色权限，尤其是任务分配、用户角色、版本回滚和导出接口。








