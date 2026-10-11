<!-- Owner: 蔡振翰（B丙·数据导出部署） -->
# 壁画结构化语义标注系统 · 框架骨架（Skeleton）

> 本仓库是**可填充的工程骨架**：目录结构、函数/类签名、docstring、TODO 占位均已就位，
> **实现逻辑全部挖空**（`raise NotImplementedError`）。照着签名填实现即可，不用从零搭结构。

## 技术栈

- **后端**：FastAPI + SQLite（WAL），是全系统唯一事实源
- **前端**：19 个 HTML 页面 + `assets/`（`shared.css` 样式 / `shared.js` 状态与同步层）
- **AI 标注**：`backend/annotator.py` 按《壁画结构化语义标注教程》S0–S7 八遍流程的规则引擎
- **导出**：`GET /api/export?format=json|jsonl`，附导出 QC 校验（`backend/qc.py`）
- **测试**：`unittest`（`tests/`）

## 模块归属（Owner）

| Owner | 岗位 | 负责文件 |
|-------|------|---------|
| 于金果 | A甲·标注引擎 | `backend/annotator.py`、`tests/test_annotator.py` |
| 贾涵玉 | A乙·体系与评测 | `taxonomy/`、`benchmark/`、`backend/qc.py` |
| 韩雨杰 | B甲·后端 | `backend/main.py`、`backend/db.py`、`tests/test_api.py` |
| 李鹏祥 | B乙·前端 | `frontend/`（19 页 + assets） |
| 蔡振翰 | B丙·数据导出部署 | `backend/seed_data.py`、`backend/exporter.py`、`run.py`、`start.sh`、`启动.bat`、`README.md`、`requirements.txt` |

> 每个文件顶部已加归属注释（`# Owner` / `<!-- Owner -->` / `/* Owner */` 等，按文件类型用对应语法）。

## 目录结构

```
backend/
  __init__.py     包标记
  main.py         FastAPI 路由 + 前端静态托管          ← TODO 填实现
  db.py           SQLite 持久化（state 镜像表 + ai_runs）← TODO 填实现
  annotator.py    S0–S7 规则标注引擎                    ← TODO 填实现
  qc.py           导出 QC 校验                           ← TODO 填实现
  exporter.py     JSON / JSONL 导出                     ← TODO 填实现
  seed_data.py    种子数据（与前端 shared.js 默认值一致） ← TODO 填实现
frontend/         19 个页面 + assets/                   ← TODO 填页面内容
taxonomy/         分类体系契约文件（taxonomy.json）       ← TODO 填词条
benchmark/        金标准 + 评测脚本（eval.py）           ← TODO 填数据与评测
tests/            unittest 测试                        ← TODO 填断言
run.py            启动脚本（框架保留，可直接用）
启动.bat          Windows 一键启动（双击）
start.sh          macOS / Linux 一键启动（bash start.sh）
```

## API 一览（签名已定，逻辑待填）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/health` | 健康检查 |
| GET  | `/api/bootstrap` | 首屏同步：返回 state 全量 |
| POST | `/api/state/{key}` | 写入白名单 state 键 |
| GET  | `/api/samples` | 可分配壁画列表 |
| GET  | `/api/samples/{id}` | 单幅壁画详情 |
| POST | `/api/ai/run` | 运行 8-pass 标注引擎 `{mural_id}` |
| GET  | `/api/ai/runs` | AI 运行历史 |
| GET  | `/api/export` | 导出审核草稿 `format=json|jsonl` |

## 填充指南

1. **后端**：每个 `backend/*.py` 中函数体均为 `raise NotImplementedError("TODO: ...")`，
   按 docstring 描述实现即可。模块间依赖关系见各文件顶部 import。
2. **前端**：`frontend/assets/shared.js` 已列出全部状态函数签名（`// TODO` 占位）；
   19 个 HTML 页面为最小骨架，需补充页面结构并 `link` 到 `shared.css`、`script` 到 `shared.js`。
3. **分类体系**：`taxonomy/taxonomy.json` 是标注引擎 S2 的输入，先填词条（11/9/14/43）。
4. **金标准评测**：`benchmark/gold_standard/` 填 15–20 张金标准，`benchmark/eval.py` 实现 P/R 评测。
5. **测试**：`tests/` 已列出测试类与方法名，填断言后 `python3 -m unittest discover -s tests`。

## 运行（填完实现后）

```bash
# 方式 A · 一键启动
Windows：双击 启动.bat
macOS / Linux：bash start.sh

# 方式 B · 手动
pip install -r requirements.txt
python run.py --port 8000        # http://127.0.0.1:8000
```

## 说明

- **二进制资源**：`frontend/assets/sample_mural.png` 为示例图，骨架不含（无法用文本占位），
  请自行放入同名文件。
- 数据库 `mural.db` 首次运行自动生成，已加入 `.gitignore`，不随仓库分发。
