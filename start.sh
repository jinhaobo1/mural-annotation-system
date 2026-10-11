#!/usr/bin/env bash
# Owner: 蔡振翰（B丙·数据导出部署）
# 壁画结构化语义标注系统 · 一键启动（macOS / Linux）
set -e
cd "$(dirname "$0")"

# ---------- [1/3] 找 Python ----------
PY=""
for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
    echo "[X] 未找到 Python：请先安装 Python 3.10+"
    echo "    macOS：brew install python 或 https://www.python.org/downloads/"
    echo "    Linux：sudo apt install python3 python3-venv"
    exit 1
fi
echo "[1/3] 检测到 Python：$PY"

# ---------- [2/3] 虚拟环境 ----------
RUNPY=""
EXTRA=""
if [ -x ".venv/bin/python" ]; then
    RUNPY="./.venv/bin/python"
    echo "[2/3] 虚拟环境已存在，复用"
elif "$PY" -m venv .venv 2>&1; then
    RUNPY="./.venv/bin/python"
    echo "[2/3] 独立虚拟环境创建完成"
else
    echo "[2/3] 虚拟环境创建失败（Linux 常见原因：缺 python3-venv 包）"
    echo "      已自动降级：改用系统 Python，依赖装到用户目录"
    echo "      建议之后执行 sudo apt install python3-venv，重跑本脚本即可获得独立环境"
    rm -rf .venv
    RUNPY="$PY"
    EXTRA="--user"
fi

# ---------- [3/3] 依赖 + 启动 ----------
echo "[3/3] 检查/安装依赖（仅首次约 1-3 分钟）..."
if ! "$RUNPY" -m pip install -q --disable-pip-version-check $EXTRA -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple; then
    echo "      清华镜像下载失败，改用官方源重试..."
    "$RUNPY" -m pip install -q --disable-pip-version-check $EXTRA -r requirements.txt
fi
echo "[3/3] 依赖就绪，启动服务..."
echo
echo "  服务地址 http://127.0.0.1:8000（如装有桌面环境会自动打开浏览器）"
echo "  停止服务：按 Ctrl+C；日常使用重新执行 bash start.sh 即可"
echo
( sleep 4
  if command -v xdg-open >/dev/null 2>&1; then xdg-open http://127.0.0.1:8000 >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open http://127.0.0.1:8000
  fi ) &
exec "$RUNPY" run.py
