@echo off
chcp 65001 >nul
title 壁画展示系统 · 启动器
setlocal enabledelayedexpansion
rem ============================================================
rem  壁画展示系统 · Windows 启动脚本
rem  功能：检测 Python -> 创建/复用 venv -> 安装依赖 -> 启动系统
rem  路径：全部使用 %~dp0 相对路径，不写死绝对路径
rem ============================================================
rem 切换到脚本所在目录（关键：保证相对路径正确）
cd /d "%~dp0"
echo ============================================================
echo    壁画展示系统 · 启动器
echo ============================================================
echo    工作目录：%~dp0
echo ============================================================
echo.
rem ---------- 第 1 步：检测 Python 环境 ----------
echo [1/4] 检测 Python 环境...
set "PYEXE="
rem 优先使用 py 启动器（Windows 官方推荐）
where py >nul 2>nul
if %errorlevel%==0 (
    set "PYEXE=py"
    echo       找到 Python 启动器：py
    goto :py_found
)
rem 其次使用 python 命令
where python >nul 2>nul
if %errorlevel%==0 (
    set "PYEXE=python"
    echo       找到 Python 命令：python
    goto :py_found
)
rem 未找到 Python
echo.
echo ============================================================
echo  [错误] 未检测到 Python 环境！
echo ============================================================
echo.
echo  本系统需要 Python 3.8 或更高版本才能运行。
echo.
echo  解决方法：
echo    1. 访问 https://www.python.org/downloads/ 下载安装
echo    2. 安装时务必勾选 "Add Python to PATH"
echo    3. 安装完成后重新运行本脚本
echo.
echo  提示：如果只想导出数据，可直接双击 exporter.exe（免 Python）。
echo.
pause
exit /b 1
:py_found
rem 显示 Python 版本
%PYEXE% --version 2>&1
echo.
rem ---------- 第 2 步：创建/复用虚拟环境 ----------
echo [2/4] 检查虚拟环境 venv...
if exist "%~dp0venv\Scripts\python.exe" (
    echo       虚拟环境已存在，跳过创建
) else (
    echo       未找到虚拟环境，正在创建...
    %PYEXE% -m venv "%~dp0venv"
    if errorlevel 1 (
        echo.
        echo ============================================================
        echo  [错误] 虚拟环境创建失败！
        echo ============================================================
        echo  请检查磁盘空间与权限，或手动执行：
        echo      %PYEXE% -m venv venv
        echo.
        pause
        exit /b 1
    )
    echo       虚拟环境创建成功
)
set "VENV_PY=%~dp0venv\Scripts\python.exe"
echo.
rem ---------- 第 3 步：安装依赖 ----------
echo [3/4] 检查并安装依赖...
if exist "%~dp0requirements.txt" (
    rem 检查关键依赖是否已装（以 openpyxl 为例）
    "%VENV_PY%" -c "import openpyxl" >nul 2>nul
    if errorlevel 1 (
        echo       正在安装依赖（首次运行需要几分钟）...
        "%VENV_PY%" -m pip install -r "%~dp0requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple
        if errorlevel 1 (
            echo.
            echo ============================================================
            echo  [警告] 依赖安装失败，尝试使用默认源重试...
            echo ============================================================
            "%VENV_PY%" -m pip install -r "%~dp0requirements.txt"
            if errorlevel 1 (
                echo.
                echo  [错误] 依赖安装仍然失败，请检查网络连接。
                echo.
                pause
                exit /b 1
            )
        )
        echo       依赖安装完成
    ) else (
        echo       依赖已安装，跳过
    )
) else (
    echo       未找到 requirements.txt，跳过依赖安装
)
echo.
rem ---------- 第 4 步：启动程序 ----------
echo [4/4] 启动壁画展示系统...
echo ============================================================
echo.
if exist "%~dp0server.py" (
    rem 优先启动展示系统（会自动打开浏览器）
    "%VENV_PY%" "%~dp0server.py"
) else if exist "%~dp0exporter.py" (
    rem 没有 server.py 则运行导出工具
    echo  未找到 server.py，改为运行导出工具 exporter.py
    "%VENV_PY%" "%~dp0exporter.py" all
) else (
    echo  [错误] 未找到 server.py 或 exporter.py
    echo.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo  程序已结束。
echo ============================================================
pause
endlocal