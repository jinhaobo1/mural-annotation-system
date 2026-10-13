<!-- Owner: 贾涵玉（A乙·体系与评测） -->
# taxonomy · 分类体系契约文件（A乙）

本目录是 **A甲（标注引擎 S2）的输入**，也是全组**第一优先级**的交付物。

`taxonomy.json` 已从 `frontend/assets/shared.js` 的 `defaultAnnotationTaxonomy()` + `getSceneHierarchy()`
抽取，与前端默认值完全一致。

## taxonomy.json 结构

| 字段 | 说明 | 数量 |
|------|------|------|
| `terms` | 实体词条树（`id` / `name` / `parent` / `level`） | 78（一级 11、HUMAN 二级 9、三级若干） |
| `fact_schemas` | 属性/状态/动作抽取模板（`kind`/`code`/`values`/`applies_to`） | 18 |
| `scenes` | 一级场景（扁平列表） | 14 |
| `scene_hierarchy` | 一级场景层级树（含二级子类） | 14 |
| `events` | 事件类型 | 7 |
| `relations` | 关系类型（`family` / `predicate` / `sub` / `obj`） | 5 族共 43（空间 15 / 隶属 4 / 互动 9 / 叙事 12 / 文字 3） |

## 契约规则

- 与教程第 2 章逐项核对通过后交付 A甲
- 冻结后任何修改须经管理员确认并当日同步两组（咬合点 2）
- 当前引擎 `backend/annotator.py` 仍用内置词汇表；如需引擎读取本文件，需 A甲/A乙 共同约定加载方式（属契约变更）
