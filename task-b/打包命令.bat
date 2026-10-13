@echo off
chcp 65001 >nul
title exporter.exe 打包脚本
cd /d "%~dp0"
echo ==============================================
echo    exporter.exe 打包脚本
echo    （数据库已通过 --add-data 打包进 exe）
echo ==============================================
echo.
set PYEXE=
if exist "%~dp0venv\Scripts\python.exe" set "PYEXE=%~dp0venv\Scripts\python.exe"
if "%PYEXE%"=="" ( where py >nul 2>nul && set PYEXE=py )
if "%PYEXE%"=="" ( where python >nul 2>nul && set PYEXE=python )
if "%PYEXE%"=="" (
    echo [错误] 未检测到 Python 环境
    pause
    exit /b 1
)
echo 使用解释器: %PYEXE%
echo.
"%PYEXE%" -m PyInstaller ^
    --onefile ^
    --console ^
    --name exporter ^
    --add-data "%~dp0壁画数据库.db;." ^
    --distpath "%~dp0" ^
    --workpath "%~dp0build" ^
    --specpath "%~dp0build" ^
    "%~dp0exporter.py"
if %errorlevel%==0 (
    echo.
    echo [成功] 打包完成：exporter.exe
    echo 数据库「壁画数据库.db」已内嵌进 exe。
) else (
    echo.
    echo [失败] 打包出错，请检查上方错误信息。
)
echo.
pause