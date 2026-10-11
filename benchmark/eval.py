# -*- coding: utf-8 -*-
# Owner: 贾涵玉（A乙·体系与评测）
"""评测脚本：对比引擎输出与金标准，计算 Precision/Recall，跑教程 8.1 自查清单。

输出物：每轮 P/R 报告 + 错误分析报告（A甲 修复的唯一依据）。
"""


def load_gold(path):
    """加载单张金标准标注 JSON（5 层结构：场景→区域→事件→组→实体）。"""
    raise NotImplementedError("TODO: 加载金标准")


def align_entities(pred_entities, gold_entities):
    """预测实体与金标准实体对齐，返回匹配对列表。"""
    raise NotImplementedError("TODO: 实体对齐")


def compute_precision_recall(pred, gold):
    """计算 Precision / Recall（实体 + 关系），返回 {entity:{p,r}, relation:{p,r}}。"""
    raise NotImplementedError("TODO: 计算 P/R")


def check_checklist_81(doc):
    """教程 8.1 自查清单逐条自动检查，返回阻断项列表（验收要求阻断项为 0）。"""
    raise NotImplementedError("TODO: 8.1 自查清单检查")


def run_evaluation(gold_dir, annotate_fn):
    """遍历金标准目录，逐张评测，汇总输出 P/R 报告 + 错误分析报告。"""
    raise NotImplementedError("TODO: 全量评测")


if __name__ == "__main__":
    # TODO: 命令行入口，跑 run_evaluation 并打印报告
    raise NotImplementedError("TODO: 评测入口")
