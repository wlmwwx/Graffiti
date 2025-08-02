#!/bin/bash

# 手部追踪画图应用 - 本地开发启动脚本

echo "🎨 手部追踪画图应用 - 本地开发服务器"
echo "========================================"

# 检查是否在项目目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查可用的服务器选项
echo "🔍 检查可用的服务器选项..."

# 检查Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    PYTHON_CMD=""
fi

# 检查Node.js
if command -v npx &> /dev/null; then
    NODE_AVAILABLE=true
else
    NODE_AVAILABLE=false
fi

# 检查PHP
if command -v php &> /dev/null; then
    PHP_AVAILABLE=true
else
    PHP_AVAILABLE=false
fi

echo ""
echo "🚀 可用的服务器选项："
echo ""

if [ ! -z "$PYTHON_CMD" ]; then
    echo "1. Python HTTP 服务器 (推荐)"
    echo "   命令: $PYTHON_CMD -m http.server 8000"
    echo "   访问: http://localhost:8000"
    echo ""
fi

if [ "$NODE_AVAILABLE" = true ]; then
    echo "2. Node.js 服务器"
    echo "   命令: npx serve . -p 8001"
    echo "   访问: http://localhost:8001"
    echo ""
fi

if [ "$PHP_AVAILABLE" = true ]; then
    echo "3. PHP 内置服务器"
    echo "   命令: php -S localhost:8002"
    echo "   访问: http://localhost:8002"
    echo ""
fi

# 自动选择并启动服务器
echo "⚙️ 自动启动最佳服务器..."

if [ ! -z "$PYTHON_CMD" ]; then
    echo "🐍 启动 Python HTTP 服务器..."
    echo "📱 应用将在 http://localhost:8000 可用"
    echo "🔒 请确保使用 http://localhost:8000 访问以获得摄像头权限"
    echo ""
    echo "💡 提示：按 Ctrl+C 停止服务器"
    echo "========================================"
    echo ""
    $PYTHON_CMD -m http.server 8000
elif [ "$NODE_AVAILABLE" = true ]; then
    echo "📦 启动 Node.js 服务器..."
    echo "📱 应用将在 http://localhost:8001 可用"
    echo "🔒 请确保使用 http://localhost:8001 访问以获得摄像头权限"
    echo ""
    echo "💡 提示：按 Ctrl+C 停止服务器"
    echo "========================================"
    echo ""
    npx serve . -p 8001
elif [ "$PHP_AVAILABLE" = true ]; then
    echo "🔧 启动 PHP 内置服务器..."
    echo "📱 应用将在 http://localhost:8002 可用"
    echo "🔒 请确保使用 http://localhost:8002 访问以获得摄像头权限"
    echo ""
    echo "💡 提示：按 Ctrl+C 停止服务器"
    echo "========================================"
    echo ""
    php -S localhost:8002
else
    echo "❌ 未找到可用的服务器！"
    echo ""
    echo "请安装以下任一选项："
    echo "• Python: https://python.org"
    echo "• Node.js: https://nodejs.org"
    echo "• PHP: https://php.net"
    echo ""
    echo "或者手动运行："
    echo "python -m http.server 8000"
    exit 1
fi