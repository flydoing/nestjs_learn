# NestJS 框架概览与快速开始

> 本文档面向有前端经验的开发者，帮助你快速理解 NestJS 的核心概念

## 什么是 NestJS？

NestJS 是一个用于构建高效、可扩展的 Node.js 服务端应用程序的渐进式框架。它使用 TypeScript 构建，并结合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数响应式编程）的元素。

### 为什么选择 NestJS？

作为前端开发者，你可能熟悉 Vue 或 React 的组件化思想。NestJS 采用类似的模块化架构：

| 前端概念 | NestJS 对应 |
|---------|-------------|
| 组件 (Component) | 控制器 (Controller) |
| 服务/状态管理 | 服务 (Service/Provider) |
| 模块/插件 | 模块 (Module) |
| 路由守卫 | 守卫 (Guard) |
| 拦截器 | 拦截器 (Interceptor) |

---

## 核心概念速览

### 1. Module（模块）

模块是组织代码的基本单元，类似于 Vue/React 中的功能模块划分。

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [],           // 导入其他模块
  controllers: [UserController],  // 控制器
  providers: [UserService],       // 服务提供者
  exports: [UserService],         // 导出给其他模块使用
})
export class AppModule {}
```

### 2. Controller（控制器）

控制器负责处理传入的请求并返回响应，类似于路由处理。

```typescript
// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')  // 路由前缀 /users
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()  // GET /users
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')  // GET /users/:id
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Post()  // POST /users
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### 3. Service（服务）

服务负责业务逻辑，可被注入到控制器或其他服务中。

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()  // 标记为可注入的服务
export class UserService {
  private users = [];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(user => user.id === id);
  }

  create(createUserDto: CreateUserDto) {
    const user = { id: Date.now(), ...createUserDto };
    this.users.push(user);
    return user;
  }
}
```

---

## 环境搭建

### 1. 安装 Node.js

确保安装 Node.js 18.x 或更高版本：

```bash
# 检查 Node.js 版本
node -v  # 应该 >= 18.0.0

# 检查 npm 版本
npm -v
```

### 2. 安装 NestJS CLI

```bash
# 全局安装 NestJS CLI
npm install -g @nestjs/cli

# 验证安装
nest --version
```

### 3. 创建新项目

```bash
# 创建项目
nest new my-nest-app

# 选择包管理器 (npm/yarn/pnpm)
# 推荐使用 pnpm

# 进入项目目录
cd my-nest-app

# 启动开发服务器
npm run start:dev
```

访问 `http://localhost:3000`，看到 "Hello World!" 即表示成功。

---

## 项目结构

```
my-nest-app/
├── src/
│   ├── app.controller.ts      # 基础控制器
│   ├── app.controller.spec.ts # 控制器测试
│   ├── app.module.ts          # 根模块
│   ├── app.service.ts         # 基础服务
│   └── main.ts                # 应用入口
├── test/                      # E2E 测试
├── nest-cli.json              # NestJS CLI 配置
├── package.json
├── tsconfig.json              # TypeScript 配置
└── tsconfig.build.json
```

### 入口文件 main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // 创建 Nest 应用实例
  const app = await NestFactory.create(AppModule);
  
  // 设置全局前缀（可选）
  // app.setGlobalPrefix('api');
  
  // 启动应用
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

---

## 常用 CLI 命令

```bash
# 生成模块
nest g module user

# 生成控制器
nest g controller user

# 生成服务
nest g service user

# 一次性生成完整资源（推荐）
nest g resource user
# 选择 REST API，会自动生成 CRUD 代码

# 生成中间件
nest g middleware logger

# 生成守卫
nest g guard auth

# 生成拦截器
nest g interceptor transform

# 生成管道
nest g pipe validation
```

---

## 请求处理装饰器

### HTTP 方法装饰器

```typescript
import { 
  Get, Post, Put, Patch, Delete,
  Param, Query, Body, Headers
} from '@nestjs/common';

@Controller('posts')
export class PostController {
  
  @Get()                          // GET /posts
  findAll(@Query('page') page: number) {
    return `获取第 ${page} 页的文章`;
  }

  @Get(':id')                     // GET /posts/:id
  findOne(@Param('id') id: string) {
    return `获取文章 ${id}`;
  }

  @Post()                         // POST /posts
  create(@Body() body: CreatePostDto) {
    return `创建文章: ${body.title}`;
  }

  @Put(':id')                     // PUT /posts/:id (全量更新)
  update(@Param('id') id: string, @Body() body: UpdatePostDto) {
    return `更新文章 ${id}`;
  }

  @Patch(':id')                   // PATCH /posts/:id (部分更新)
  partialUpdate(@Param('id') id: string, @Body() body: Partial<UpdatePostDto>) {
    return `部分更新文章 ${id}`;
  }

  @Delete(':id')                  // DELETE /posts/:id
  remove(@Param('id') id: string) {
    return `删除文章 ${id}`;
  }
}
```

### 请求信息装饰器

```typescript
import { Req, Res, Headers, Ip } from '@nestjs/common';
import { Request, Response } from 'express';

@Get('info')
getRequestInfo(
  @Req() req: Request,           // 完整请求对象
  @Headers('user-agent') ua: string,  // 请求头
  @Ip() ip: string,              // 客户端 IP
) {
  return { ua, ip };
}
```

---

## DTO（数据传输对象）

DTO 用于定义请求/响应数据的结构，配合 class-validator 可以做参数校验：

```bash
# 安装验证相关包
npm install class-validator class-transformer
```

```typescript
// create-user.dto.ts
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: '用户名至少2个字符' })
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

在 `main.ts` 中启用全局验证管道：

```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,      // 自动过滤掉 DTO 中未定义的属性
    transform: true,      // 自动转换类型
    forbidNonWhitelisted: true,  // 存在未定义属性时抛出错误
  }));
  
  await app.listen(3000);
}
```

---

## 依赖注入（DI）

NestJS 内置了强大的依赖注入系统。对于有前端背景的开发者，可以类比 Vue 的 provide/inject：

```typescript
// 定义服务
@Injectable()
export class DatabaseService {
  query(sql: string) {
    console.log('执行 SQL:', sql);
  }
}

// 在模块中注册
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],  // 导出供其他模块使用
})
export class DatabaseModule {}

// 在其他服务中使用
@Injectable()
export class UserService {
  // 通过构造函数注入
  constructor(private readonly db: DatabaseService) {}

  findAll() {
    this.db.query('SELECT * FROM users');
  }
}
```

---

## 下一步学习

完成本文档后，建议按以下顺序继续学习：

1. [03_nestjs_core.md](./03_nestjs_core.md) - 深入理解 Controller、Service、Module
2. [04_nestjs_di.md](./04_nestjs_di.md) - 依赖注入与自定义 Provider
3. [05_nestjs_middleware.md](./05_nestjs_middleware.md) - 中间件、拦截器、管道、守卫

---

## 练习任务

1. 使用 CLI 创建一个新的 NestJS 项目
2. 创建一个 `posts` 资源，实现基本的 CRUD API
3. 添加 DTO 并配置验证管道
4. 测试所有 API 端点（可使用 Postman 或 Thunder Client）

---

## 常见问题

### Q: NestJS 和 Express 是什么关系？
A: NestJS 默认使用 Express 作为底层 HTTP 服务器，但也可以切换为 Fastify。NestJS 是在 Express 之上的更高层抽象，提供了模块化架构、依赖注入等企业级特性。

### Q: 需要先学 Express 吗？
A: 不需要。虽然 NestJS 使用 Express，但你很少需要直接操作 Express。NestJS 的抽象层已经足够完善。

### Q: 与 Koa2 相比如何？
A: Koa2 更轻量、更灵活，适合小型项目。NestJS 更重、更规范，适合中大型项目和团队协作。如果你之前用过 Koa2，会发现 NestJS 的很多概念（中间件、上下文）是相似的。

