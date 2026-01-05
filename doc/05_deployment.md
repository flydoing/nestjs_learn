# 服务端部署基础

> 面向前端开发者的 Node.js 应用部署指南

## 部署概览

将 NestJS 应用从开发环境部署到生产环境，通常需要以下步骤：

```
开发环境 → 构建打包 → 上传服务器 → 启动服务 → 配置反向代理 → 配置域名/SSL
```

### 常见部署架构

```
用户请求
    ↓
  域名 (example.com)
    ↓
  Nginx (反向代理 + 静态资源 + SSL)
    ↓
  Node.js 应用 (PM2 管理)
    ↓
  MySQL + Redis
```

---

## 构建生产版本

### NestJS 项目构建

```bash
# 安装依赖（生产环境只需要 dependencies）
npm install --production

# 或者开发时安装全部，构建后再清理
npm install
npm run build

# 构建产物在 dist/ 目录
ls dist/
```

### package.json 脚本

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  }
}
```

---

## PM2 进程管理

PM2 是 Node.js 应用的生产级进程管理器，提供：
- 进程守护（崩溃自动重启）
- 负载均衡（多进程模式）
- 日志管理
- 性能监控

### 安装 PM2

```bash
# 全局安装
npm install -g pm2
```

### 基本使用

```bash
# 启动应用
pm2 start dist/main.js --name my-nest-app

# 查看运行中的应用
pm2 list
pm2 status

# 查看日志
pm2 logs my-nest-app
pm2 logs my-nest-app --lines 100

# 重启应用
pm2 restart my-nest-app

# 停止应用
pm2 stop my-nest-app

# 删除应用
pm2 delete my-nest-app

# 监控
pm2 monit
```

### 配置文件方式（推荐）

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'my-nest-app',
      script: 'dist/main.js',
      instances: 'max',        // 使用所有 CPU 核心
      exec_mode: 'cluster',    // 集群模式
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      // 自动重启配置
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
```

使用配置文件启动：

```bash
# 开发环境
pm2 start ecosystem.config.js

# 生产环境
pm2 start ecosystem.config.js --env production

# 重新加载（零停机）
pm2 reload ecosystem.config.js

# 开机自启
pm2 startup
pm2 save
```

---

## Nginx 反向代理

Nginx 作为反向代理服务器，可以：
- 处理静态文件
- 负载均衡
- SSL 终止
- 请求缓存
- 访问控制

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# macOS
brew install nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 基础配置

编辑 `/etc/nginx/sites-available/my-nest-app`：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    # 日志
    access_log /var/log/nginx/my-nest-app.access.log;
    error_log /var/log/nginx/my-nest-app.error.log;

    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件（如果有）
    location /static/ {
        alias /var/www/my-nest-app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/my-nest-app /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

### 配置 SSL（HTTPS）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d example.com -d www.example.com

# 自动续期
sudo certbot renew --dry-run
```

---

## Docker 容器化部署

Docker 提供了一致的运行环境，简化了部署流程。

### Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 只复制必需文件
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: my-nest-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    container_name: mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: nestjs_demo
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: redis
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

### Docker 常用命令

```bash
# 构建镜像
docker build -t my-nest-app .

# 运行容器
docker run -d -p 3000:3000 --name my-nest-app my-nest-app

# 使用 docker-compose
docker-compose up -d        # 启动
docker-compose down         # 停止
docker-compose logs -f app  # 查看日志
docker-compose ps           # 查看状态
```

---

## 环境变量管理

### 使用 .env 文件

```bash
# .env.production
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=nestjs_demo

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
```

### NestJS 配置模块

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
  ],
})
export class AppModule {}
```

```typescript
// 使用配置
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDatabaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST');
  }
}
```

---

## 部署检查清单

### 上线前检查

- [ ] 移除所有调试代码和 console.log
- [ ] 配置生产环境变量
- [ ] 数据库连接配置正确
- [ ] Redis 连接配置正确
- [ ] 关闭 TypeORM synchronize（使用 migrations）
- [ ] 配置错误处理和日志
- [ ] 配置 CORS
- [ ] 配置安全头（Helmet）
- [ ] 配置压缩（Compression）

### 安全配置

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全头
  app.use(helmet());

  // 响应压缩
  app.use(compression());

  // CORS
  app.enableCors({
    origin: ['https://example.com'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

---

## 监控与日志

### 应用日志

```typescript
// 使用 NestJS 内置 Logger
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findAll() {
    this.logger.log('Fetching all users');
    this.logger.warn('This is a warning');
    this.logger.error('This is an error', error.stack);
  }
}
```

### PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show my-nest-app

# Web 监控面板
pm2 plus
```

---

## 常见部署问题

### 1. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀掉进程
kill -9 <PID>
```

### 2. 权限问题

```bash
# 给予执行权限
chmod +x ./dist/main.js

# PM2 日志目录权限
sudo chown -R $USER:$USER /var/log/pm2/
```

### 3. 内存不足

```bash
# 增加 Node.js 内存限制
node --max-old-space-size=4096 dist/main.js

# PM2 配置
pm2 start dist/main.js --node-args="--max-old-space-size=4096"
```

---

## 下一步学习

- **41_pm2_deploy.md** - PM2 深入使用
- **42_docker_basics.md** - Docker 详解
- **43_nginx_config.md** - Nginx 高级配置

---

## 练习任务

1. 构建 NestJS 项目的生产版本
2. 使用 PM2 启动和管理应用
3. 配置 Nginx 反向代理
4. 使用 Docker Compose 部署完整应用栈
5. 配置 SSL 证书（可使用 Let's Encrypt）

