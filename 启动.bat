@echo off
chcp 65001 >nul
title 壁画结构化语义标注系统
cd /d "%~dp0"

echo ============================================
echo   壁画结构化语义标注系统 · 一键启动
echo ============================================
echo.

rem ---------- [1/4] 找 Python ----------
set "PYCMD="
where py >nul 2>nul && set "PYCMD=py"
if not defined PYCMD (
    where python >nul 2>nul && set "PYCMD=python"
)
if not defined PYCMD (
    echo [X] 没有检测到 Python，请先安装，二选一：
    echo     方式一：打开 https://www.python.org/downloads/ 下载安装包，
    echo            安装第一个界面务必勾选「Add python.exe to PATH」
    echo     方式二：微软商店搜「Python 3.12」直接安装（自动配好 PATH）
    echo     装完后重新双击「启动.bat」即可。
    echo.
    pause
    exit /b 1
)
echo [1/4] 检测到 Python：%PYCMD%

rem ---------- [2/4] 虚拟环境 ----------
if not exist ".venv\Scripts\python.exe" (
    echo [2/4] 正在创建独立虚拟环境（仅首次，约 1 分钟）...
    %PYCMD% -m venv .venv
    if errorlevel 1 (
        echo [X] 创建虚拟环境失败，请把上方报错截图发给我。
        pause
        exit /b 1
    )
) else (
    echo [2/4] 虚拟环境已存在，跳过
)
set "VPY=.venv\Scripts\python.exe"

rem ---------- [3/4] 安装依赖 ----------
echo [3/4] 检查/安装依赖（仅首次约 1-3 分钟，取决于网速）...
"%VPY%" -m pip install -q --disable-pip-version-check -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if errorlevel 1 (
    echo     清华镜像下载失败，改用官方源重试...
    "%VPY%" -m pip install -q --disable-pip-version-check -r requirements.txt
    if errorlevel 1 (
        echo [X] 依赖安装失败：多为网络问题。换网络后重跑，或把报错截图发给我。
        pause
        exit /b 1
    )
)

rem ---------- [4/4] 启动 ----------
echo [4/4] 依赖就绪，启动服务...
echo.
echo   浏览器将自动打开 http://127.0.0.1:8000
echo   停止服务：直接关闭本窗口（或按 Ctrl+C）
echo   日常使用：以后双击「启动.bat」即可，依赖不会重复安装
echo.
rem 延迟 4 秒再开浏览器，等服务起来
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:8000'"
"%VPY%" run.py
echo.
echo 服务已停止。
pause
