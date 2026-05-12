# Web平台开发指南

## 概述
本文档描述OtakuClaw项目的Web端实现，包括开发环境配置、构建部署以及与桌面版的差异说明。

## 快速开始

### 开发环境

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm run frontend:dev:web
   ```

3. **访问应用**
   - 默认地址: http://localhost:3000
   - API代理: /api → http://127.0.0.1:8000

### 生产构建

```bash
# 构建Web版本
pnpm run frontend:build:web

# 预览构建结果
pnpm run frontend:preview:web
```

构建产物输出到 `front_end/dist-web/` 目录。

## 架构设计

### 目录结构

```
front_end/
├── src/
│   ├── components/     # 通用组件
│   ├── hooks/          # 自定义Hooks
│   ├── services/       # 服务层
│   │   ├── desktopBridge.js    # 桌面桥接服务
│   │   └── webApiService.js    # Web API服务
│   ├── shells/         # 页面容器组件
│   │   ├── MainShell.jsx
│   │   ├── WebShell.jsx        # Web专用外壳
│   │   └── ScenicGuideShell.jsx
│   └── routes/         # 路由配置
│       └── WebRoutes.jsx        # Web路由
├── public/             # 静态资源
└── vite.web.config.js  # Web专用Vite配置
```

### 核心组件

#### WebShell
Web环境的主容器组件，提供：
- 功能概览和系统状态
- 与桌面版类似的功能界面
- 浏览器环境适配

#### webApiService
Web环境的API通信服务，支持：
- RESTful API调用
- 流式响应处理
- 文件上传/下载
- 语音API集成

## 环境变量配置

### 开发环境 (.env.development)

```bash
# API配置
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_API_KEY=

# 代理配置
VITE_API_PROXY_URL=http://127.0.0.1:8000

# 开发服务器
VITE_DEV_PORT=3000
```

### 生产环境 (.env.production)

```bash
# API配置 (通过服务器反向代理)
VITE_API_BASE_URL=/api
VITE_API_KEY=

# 部署路径 (支持子目录)
VITE_BASE_PATH=/

# CDN配置
VITE_USE_CDN=false

# 分析工具
VITE_ENABLE_ANALYZER=false
```

## 与桌面版的差异

### 功能对比

| 功能 | 桌面版 | Web版 | 备注 |
|------|--------|-------|------|
| Live2D模型 | ✅ 本地加载 | ✅ 可用 | 需要手动导入模型文件 |
| 语音交互 | ✅ 内置支持 | ⚠️ 受限 | 依赖浏览器Web Audio API |
| 屏幕截图 | ✅ 系统级 | ❌ 不支持 | 需要桌面环境权限 |
| 文件系统 | ✅ 直接访问 | ⚠️ 受限 | 仅通过文件选择器 |
| 自动更新 | ✅ 支持 | ❌ 不支持 | Web版需手动刷新 |
| 系统托盘 | ✅ 支持 | ❌ 不支持 | 仅桌面版 |
| 全局快捷键 | ✅ 支持 | ❌ 不支持 | 仅桌面版 |

### API差异

#### desktopBridge适配
`desktopBridge` 服务会自动检测运行环境：
- 桌面环境：调用Electron IPC
- Web环境：返回相应的错误信息或提供替代方案

```javascript
// 示例：检查功能可用性
const api = getDesktopApi();
if (!api) {
  // Web环境，提供替代实现或提示用户
  console.warn('此功能仅在桌面版可用');
}
```

## 部署方案

### Nginx部署

1. **构建应用**
   ```bash
   pnpm run frontend:build:web
   ```

2. **上传到服务器**
   ```bash
   scp -r front_end/dist-web/* user@server:/var/www/otakuclaw/
   ```

3. **配置Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/otakuclaw;
       index index.html;

       # SPA路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }

       # API代理
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

### Docker部署

1. **构建镜像**
   ```bash
   docker build -f front_end/Dockerfile.web -t otakuclaw-web:latest .
   ```

2. **运行容器**
   ```bash
   docker run -d -p 8080:80 --name otakuclaw-web otakuclaw-web:latest
   ```

3. **使用Docker Compose**
   ```bash
   docker-compose -f front_end/docker-compose.web.yml up -d
   ```

### Vercel/Netlify部署

#### Vercel
1. 连接Git仓库
2. 设置构建命令: `pnpm run frontend:build:web`
3. 设置输出目录: `front_end/dist-web`
4. 配置环境变量

#### Netlify
1. 连接Git仓库
2. 设置构建命令:
   ```bash
   pnpm install
   pnpm run frontend:build:web
   ```
3. 设置发布目录: `front_end/dist-web`
4. 添加重定向规则 (`_redirects`):
   ```
   /* /index.html 200
   ```

## 性能优化

### 代码分割
- React组件懒加载
- 第三方库分包
- 路由级别代码分割

### 资源优化
- 图片压缩和WebP格式
- CSS/JS压缩
- Gzip/Brotli压缩

### 缓存策略
- 静态资源长期缓存
- HTML文件不缓存
- Service Worker缓存

### 构建分析
```bash
# 启用构建分析
VITE_ENABLE_ANALYZER=true pnpm run frontend:build:web
```

## 浏览器兼容性

### 支持的浏览器
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器 (iOS Safari, Chrome Mobile)

### 必需的浏览器API
- Fetch API
- WebSocket
- Web Audio API (语音功能)
- FileReader API (文件上传)
- localStorage/sessionStorage

### Polyfills
项目使用Vite的 `@vitejs/plugin-react` 插件，自动处理大部分现代JavaScript特性。如需支持旧浏览器，可以添加：
```bash
pnpm add -D @vitejs/plugin-legacy
```

## 常见问题

### Q: 如何配置API地址？
A: 通过环境变量 `VITE_API_BASE_URL` 配置。开发环境使用代理，生产环境通常配置相对路径通过服务器反向代理。

### Q: 语音功能不工作？
A: 确保浏览器支持Web Audio API，并且用户已授予麦克风权限。注意某些浏览器要求HTTPS环境。

### Q: Live2D模型加载失败？
A: Web环境需要手动提供模型文件，确保模型文件路径正确且可访问。

### Q: 路由刷新404？
A: 配置服务器将所有请求重定向到 `index.html`，或使用HTML5 History模式。

### Q: 如何调试生产构建？
A: 使用 `pnpm run frontend:preview:web` 预览构建结果，或在浏览器中使用开发者工具。

## 开发工具

### VSCode配置
推荐安装扩展：
- ES Lint
- Prettier
- Auto Import
- Path Intellisense

### Git Hooks
配置pre-commit钩子自动检查代码：
```bash
pnpm add -D husky lint-staged
npx husky install
```

## 安全考虑

### XSS防护
- React自动转义输出
- 避免使用 `dangerouslySetInnerHTML`
- CSP头配置

### CSRF防护
- API使用Bearer Token认证
- SameSite Cookie配置

### 数据安全
- 避免在前端存储敏感信息
- 使用HTTPS传输
- API密钥通过后端代理

## 相关文档
- [桌面端开发指南](./Windows-Platform-Guide.md)
- [Android开发指南](./Android-Setup-Guide.md)
- [构建脚本说明](../scripts/README.md)

## 贡献指南
欢迎提交Issue和Pull Request来改进Web端实现。在提交前请确保：
1. 代码通过ESLint检查
2. 功能在主流浏览器中测试
3. 添加必要的文档注释
