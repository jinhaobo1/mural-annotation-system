# -*- coding: utf-8 -*-
# Owner: 蔡振翰（B丙·数据导出部署）
"""种子数据：首次运行建库时写入，与前端 assets/shared.js 的默认值保持一致。

包含：示例壁画（MURAL-02315 等）、标注体系（taxonomy）、关系体系、默认任务等。
"""


def default_state():
    """返回默认 state 字典（key -> value），key 与前端 localStorage 键一致。

    TODO: 构造并返回与前端 shared.js 默认值一致的种子数据。
    """
    raise NotImplementedError("TODO: 返回默认种子 state")
