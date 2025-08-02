#!/bin/bash

# 手部追踪画图应用部署脚本

echo "🚀 开始部署手部追踪画图应用..."

# 检查必要文件
echo "📋 检查项目文件..."
required_files=("index.html" "styles.css" "app.js" "package.json" "_headers" "README.md")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    else
        echo "✅ $file 存在"
    fi
done

# 初始化Git仓库（如果不存在）
if [ ! -d ".git" ]; then
    echo "🔧 初始化Git仓库..."
    git init
    git branch -M main
fi

# 添加所有文件到Git
echo "📦 添加文件到Git..."
git add .

# 提交更改
echo "💾 提交更改..."
commit_message="Deploy hand tracking drawing app - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$commit_message"

echo "✅ 本地准备完成!"
echo ""
echo "🌐 下一步部署到Cloudflare Pages:"
echo "1. 推送代码到GitHub/GitLab:"
echo "   git remote add origin <your-repo-url>"
echo "   git push -u origin main"
echo ""
echo "2. 在Cloudflare Pages连接仓库:"
echo "   - 访问 https://dash.cloudflare.com/pages"
echo "   - 点击 'Create a project'"
echo "   - 选择 'Connect to Git'"
echo "   - 选择你的仓库"
echo ""
echo "3. 构建设置:"
echo "   - Build command: (留空)"
echo "   - Build output directory: /"
echo "   - Root directory: /"
echo ""
echo "📱 或者直接上传文件:"
echo "   - 在Cloudflare Pages选择 'Upload assets'"
echo "   - 上传所有项目文件"
echo ""
echo "🎉 部署完成后，你的应用将在 <project-name>.pages.dev 可用!"

# 创建zip文件以便上传
echo "📦 创建部署包..."
zip -r hand-tracking-drawing-app.zip . -x "*.git*" "deploy.sh" "*.DS_Store"
echo "✅ 部署包创建完成: hand-tracking-drawing-app.zip"