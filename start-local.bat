@echo off
chcp 65001 >nul
echo 🎨 手部追踪画图应用 - 本地开发服务器
echo ========================================

REM 检查是否在项目目录
if not exist "index.html" (
    echo ❌ 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 🔍 检查可用的服务器选项...
echo.

REM 检查Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    set PYTHON_AVAILABLE=true
    echo ✅ Python 可用
) else (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 (
        set PYTHON_AVAILABLE=true
        set PYTHON_CMD=python3
        echo ✅ Python3 可用
    ) else (
        set PYTHON_AVAILABLE=false
        echo ❌ Python 不可用
    )
)

REM 检查Node.js
npx --version >nul 2>&1
if %errorlevel% == 0 (
    set NODE_AVAILABLE=true
    echo ✅ Node.js 可用
) else (
    set NODE_AVAILABLE=false
    echo ❌ Node.js 不可用
)

REM 检查PHP
php --version >nul 2>&1
if %errorlevel% == 0 (
    set PHP_AVAILABLE=true
    echo ✅ PHP 可用
) else (
    set PHP_AVAILABLE=false
    echo ❌ PHP 不可用
)

echo.
echo 🚀 启动本地服务器...

if "%PYTHON_AVAILABLE%"=="true" (
    echo 🐍 启动 Python HTTP 服务器...
    echo 📱 应用将在 http://localhost:8000 可用
    echo 🔒 请确保使用 http://localhost:8000 访问以获得摄像头权限
    echo.
    echo 💡 提示：按 Ctrl+C 停止服务器
    echo ========================================
    echo.
    if defined PYTHON_CMD (
        %PYTHON_CMD% -m http.server 8000
    ) else (
        python -m http.server 8000
    )
) else if "%NODE_AVAILABLE%"=="true" (
    echo 📦 启动 Node.js 服务器...
    echo 📱 应用将在 http://localhost:8001 可用
    echo 🔒 请确保使用 http://localhost:8001 访问以获得摄像头权限
    echo.
    echo 💡 提示：按 Ctrl+C 停止服务器
    echo ========================================
    echo.
    npx serve . -p 8001
) else if "%PHP_AVAILABLE%"=="true" (
    echo 🔧 启动 PHP 内置服务器...
    echo 📱 应用将在 http://localhost:8002 可用
    echo 🔒 请确保使用 http://localhost:8002 访问以获得摄像头权限
    echo.
    echo 💡 提示：按 Ctrl+C 停止服务器
    echo ========================================
    echo.
    php -S localhost:8002
) else (
    echo ❌ 未找到可用的服务器！
    echo.
    echo 请安装以下任一选项：
    echo • Python: https://python.org
    echo • Node.js: https://nodejs.org  
    echo • PHP: https://php.net
    echo.
    echo 或者手动运行：
    echo python -m http.server 8000
    echo.
    pause
    exit /b 1
)

pause