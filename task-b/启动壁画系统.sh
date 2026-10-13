#!/bin/bash
# ============================================================
#  壁画展示系统 · Mac / Linux 启动脚本
#  功能：检测 Python -> 创建/复用 venv -> 安装依赖 -> 启动系统
#  路径：全部使用 $(dirname "$0") 相对路径，不写死绝对路径
# ============================================================
# 切换到脚本所在目录（关键：保证相对路径正确）
cd "$(dirname "$0")" || exit 1
WORKDIR="$(pwd)"
echo "============================================================"
echo "   壁画展示系统 · 启动器"
echo "============================================================"
echo "   工作目录：$WORKDIR"
echo "============================================================"
echo ""
# ---------- 第 1 步：检测 Python 环境 ----------
echo "[1/4] 检测 Python 环境..."
PYEXE=""
if command -v python3 >/dev/null 2>&1; then
    PYEXE="python3"
    echo "      找到 Python：python3"
elif command -v python >/dev/null 2>&1; then
    PYEXE="python"
    echo "      找到 Python：python"
else
    echo ""
    echo "============================================================"
    echo "  [错误] 未检测到 Python 环境！"
    echo "============================================================"
    echo ""
    echo "  本系统需要 Python 3.8 或更高版本才能运行。"
    echo ""
    echo "  安装方法："
    echo "    macOS：  brew install python3"
    echo "    Ubuntu： sudo apt install python3 python3-venv"
    echo "    CentOS： sudo yum install python3"
    echo ""
    echo "  安装完成后重新运行本脚本。"
    echo ""
    read -p "按回车键退出..." _
    exit 1
fi
# 显示版本
$PYEXE --version 2>&1
echo ""
# ---------- 第 2 步：创建/复用虚拟环境 ----------
echo "[2/4] 检查虚拟环境 venv..."
if [ -x "./venv/bin/python" ]; then
    echo "      虚拟环境已存在，跳过创建"
else
    echo "      未找到虚拟环境，正在创建..."
    $PYEXE -m venv ./venv
    if [ $? -ne 0 ]; then
        echo ""
        echo "============================================================"
        echo "  [错误] 虚拟环境创建失败！"
        echo "============================================================"
        echo "  请检查磁盘空间与权限，或手动执行："
        echo "      $PYEXE -m venv venv"
        echo "  提示：Debian/Ubuntu 可能需要先安装 python3-venv"
        echo "      sudo apt install python3-venv"
        echo ""
        read -p "按回车键退出..." _
        exit 1
    fi
    echo "      虚拟环境创建成功"
fi
VENV_PY="./venv/bin/python"
echo ""
# ---------- 第 3 步：安装依赖 ----------
echo "[3/4] 检查并安装依赖..."
if [ -f "./requirements.txt" ]; then
    # 检查关键依赖是否已装
    if $VENV_PY -c "import openpyxl" >/dev/null 2>&1; then
        echo "      依赖已安装，跳过"
    else
        echo "      正在安装依赖（首次运行需要几分钟）..."
        $VENV_PY -m pip install -r ./requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
        if [ $? -ne 0 ]; then
            echo ""
            echo "============================================================"
            echo "  [警告] 依赖安装失败，尝试使用默认源重试..."
            echo "============================================================"
            $VENV_PY -m pip install -r ./requirements.txt
            if [ $? -ne 0 ]; then
                echo ""
                echo "  [错误] 依赖安装仍然失败，请检查网络连接。"
                echo ""
                read -p "按回车键退出..." _
                exit 1
            fi
        fi
        echo "      依赖安装完成"
    fi
else
    echo "      未找到 requirements.txt，跳过依赖安装"
fi
echo ""
# ---------- 第 4 步：启动程序 ----------
echo "[4/4] 启动壁画展示系统..."
echo "============================================================"
echo ""
if [ -f "./server.py" ]; then
    # 优先启动展示系统（会自动打开浏览器）
    $VENV_PY ./server.py
elif [ -f "./exporter.py" ]; then
    # 没有 server.py 则运行导出工具
    echo "  未找到 server.py，改为运行导出工具 exporter.py"
    $VENV_PY ./exporter.py all
else
    echo "  [错误] 未找到 server.py 或 exporter.py"
    echo ""
    read -p "按回车键退出..." _
    exit 1
fi
echo ""
echo "============================================================"
echo "  程序已结束。"
echo "============================================================"
read -p "按回车键退出..." _