# Cloudflare Pages 部署说明

## 部署到 Cloudflare Pages

### 方法1: 通过Git仓库自动部署 (推荐)

1. **将代码推送到Git仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Hand tracking drawing app"
   git branch -M main
   git remote add origin https://github.com/yourusername/hand-tracking-drawing.git
   git push -u origin main
   ```

2. **在Cloudflare Pages连接仓库**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 转到 Pages 选项卡
   - 点击 "Create a project"
   - 选择 "Connect to Git"
   - 选择你的Git提供商 (GitHub/GitLab)
   - 选择你的仓库

3. **配置构建设置**
   ```
   Project name: hand-tracking-drawing
   Production branch: main
   Build command: (留空)
   Build output directory: /
   Root directory: /
   ```

4. **部署完成**
   - Cloudflare会自动部署并提供一个 `.pages.dev` 域名
   - 每次推送到main分支都会自动重新部署

### 方法2: 直接文件上传

1. **准备文件**
   - 确保所有文件在同一目录下
   - 必需文件: `index.html`, `styles.css`, `app.js`

2. **上传到Cloudflare Pages**
   - 在Cloudflare Pages中选择 "Upload assets"
   - 拖放文件或选择文件夹上传
   - 等待部署完成

## 环境配置

### _headers 文件 (可选)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=*
```

### _redirects 文件 (可选)
```
# 重定向到HTTPS
http://yourdomain.com/* https://yourdomain.com/:splat 301!

# SPA路由支持
/*    /index.html   200
```

## 自定义域名 (可选)

1. **在Cloudflare Pages添加自定义域名**
   - 在项目设置中点击 "Custom domains"
   - 添加你的域名
   - 更新DNS记录指向Cloudflare

2. **DNS配置**
   ```
   Type: CNAME
   Name: www (或@)
   Target: your-project.pages.dev
   ```

## HTTPS 和权限

- Cloudflare Pages默认提供免费SSL证书
- 摄像头权限需要HTTPS环境
- 自动获得全球CDN加速

## 性能优化建议

1. **启用压缩**
   - Cloudflare自动启用Gzip/Brotli压缩

2. **缓存配置**
   - 静态资源自动缓存
   - 可通过Page Rules调整缓存策略

3. **图片优化**
   - 使用Cloudflare Image Optimization (付费功能)

## 监控和分析

1. **Cloudflare Analytics**
   - 访问量统计
   - 性能指标
   - 安全威胁监控

2. **Real User Monitoring (RUM)**
   - 真实用户体验监控
   - Core Web Vitals追踪

## 故障排除

### 常见问题

1. **摄像头权限被拒绝**
   - 确保使用HTTPS
   - 检查浏览器权限设置

2. **MediaPipe加载失败**
   - 检查CDN连接
   - 考虑本地化MediaPipe文件

3. **性能问题**
   - 启用Cloudflare的性能优化功能
   - 使用浏览器开发者工具分析

### 调试方法

1. **查看控制台错误**
   ```javascript
   // 在浏览器控制台查看错误信息
   console.log('检查MediaPipe状态');
   ```

2. **网络监控**
   - 使用浏览器网络选项卡
   - 检查资源加载状态

## 安全建议

1. **内容安全策略 (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self' https://cdn.jsdelivr.net; 
                  media-src 'self'; 
                  camera 'self';">
   ```

2. **权限策略**
   ```html
   <meta http-equiv="Permissions-Policy" 
         content="camera=*">
   ```

## 维护和更新

1. **版本控制**
   - 使用语义化版本号
   - 维护更新日志

2. **备份策略**
   - Git仓库作为备份
   - 定期导出Cloudflare配置

3. **监控更新**
   - 关注MediaPipe版本更新
   - 定期测试浏览器兼容性