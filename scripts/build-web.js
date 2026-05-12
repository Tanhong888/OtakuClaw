/**
 * Web Build Script
 * 用于构建Web端版本的脚本
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });
  } catch (error) {
    log(`命令执行失败: ${command}`, 'red');
    throw error;
  }
}

// 构建环境变量配置
function buildEnvFile(mode, outputDir) {
  const envVars = {
    // 构建目标
    VITE_BUILD_TARGET: 'web',

    // API配置
    VITE_API_BASE_URL: process.env.API_BASE_URL || '',
    VITE_API_KEY: process.env.API_KEY || '',

    // 部署配置
    VITE_BASE_PATH: process.env.BASE_PATH || '/',

    // CDN配置
    VITE_USE_CDN: process.env.USE_CDN || 'false',

    // 分析配置
    VITE_ENABLE_ANALYZER: process.env.ENABLE_ANALYZER || 'false',
  };

  // 为web环境创建特殊的.env文件
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  writeFileSync(join(__dirname, '../front_end/.env.web'), envContent);
  log('已创建 .env.web 配置文件', 'green');
}

// 清理构建目录
function cleanBuildDir(outputDir) {
  const fs = await import('fs/promises');
  const path = await import('path');

  const buildDir = join(__dirname, '..', outputDir);
  try {
    await fs.rm(buildDir, { recursive: true, force: true });
    log(`已清理构建目录: ${buildDir}`, 'yellow');
  } catch (error) {
    // 目录不存在，忽略
  }
}

// 创建静态资源配置
function createStaticConfig(outputDir) {
  const config = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    mode: process.env.NODE_ENV || 'production',
    target: 'web',
  };

  const configPath = join(__dirname, '..', outputDir, 'config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  log(`已创建构建配置文件: ${configPath}`, 'green');
}

// 创建nginx配置示例
function createNginxConfig() {
  const nginxConfig = `# Nginx配置示例 for OtakuClaw Web应用

server {
    listen 80;
    server_name your-domain.com;

    # 静态文件根目录
    root /var/www/otakuclaw;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML文件不缓存
    location ~* \\.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API代理
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket支持
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA路由支持 - 所有请求返回index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
`;

  writeFileSync(
    join(__dirname, '../front_end/dist-web/nginx.conf.example'),
    nginxConfig
  );
  log('已创建 nginx.conf.example', 'green');
}

// 创建Docker配置
function createDockerConfig() {
  const dockerfile = `# Dockerfile for OtakuClaw Web Application

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm@10.28.0

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
ENV BUILD_TARGET=web
RUN pnpm run build:web

# 生产阶段
FROM nginx:alpine

# 复制自定义nginx配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist-web /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
`;

  const dockerNginxConfig = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss;

    # 静态资源
    location ~* \\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML
    location ~* \\.html$ {
        expires -1;
        add_header Cache-Control "no-cache";
    }

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

  const dockerCompose = `version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  # 可选：如果需要运行后端API
  api:
    image: your-backend-image:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://db:5432/otakuclaw
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=otakuclaw
      - POSTGRES_USER=otakuclaw
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`;

  writeFileSync(join(__dirname, '../front_end/Dockerfile.web'), dockerfile);
  writeFileSync(join(__dirname, '../front_end/docker/nginx.conf'), dockerNginxConfig);
  writeFileSync(join(__dirname, '../front_end/docker-compose.web.yml'), dockerCompose);

  log('已创建 Docker 配置文件', 'green');
}

// 主构建流程
async function buildWeb() {
  log('🚀 开始构建 OtakuClaw Web 应用...\n', 'bright');

  try {
    // 设置环境
    log('📋 步骤 1: 配置构建环境', 'blue');
    buildEnvFile('production', 'dist-web');

    // 清理旧构建
    log('🧹 步骤 2: 清理旧构建', 'blue');
    await cleanBuildDir('front_end/dist-web');

    // 执行构建
    log('🔨 步骤 3: 构建前端应用', 'blue');
    process.env.BUILD_TARGET = 'web';
    process.chdir(join(__dirname, '../front_end'));
    exec('pnpm run build', {
      env: {
        ...process.env,
        BUILD_TARGET: 'web',
      },
    });

    // 创建配置文件
    log('⚙️ 步骤 4: 生成配置文件', 'blue');
    createStaticConfig('front_end/dist-web');
    createNginxConfig();
    createDockerConfig();

    // 构建完成
    log('\n✅ 构建完成!', 'bright');
    log('📦 输出目录: front_end/dist-web', 'green');
    log('\n下一步:', 'blue');
    log('  1. 测试: pnpm run preview:web', 'yellow');
    log('  2. 部署: 将 dist-web 目录上传到服务器', 'yellow');
    log('  3. Docker: 使用 Dockerfile.web 构建镜像', 'yellow');
  } catch (error) {
    log('\n❌ 构建失败!', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// 执行构建
buildWeb();
