# NestJS 核心概念：Controller、Service、Module

> 深入理解 NestJS 的三大核心组件

## 概述

NestJS 应用程序由三个核心构建块组成：

| 组件 | 职责 | 前端类比 |
|------|------|---------|
| **Controller** | 处理 HTTP 请求，返回响应 | Vue Router 的路由处理 |
| **Service** | 业务逻辑处理 | Vuex/Pinia 的 actions |
| **Module** | 组织代码，管理依赖 | Vue 的插件系统 |

```
请求 → Controller（路由处理）→ Service（业务逻辑）→ 返回响应
              ↑                      ↑
              └── Module（组织和连接）──┘
```

---

## Controller（控制器）

控制器负责处理传入的 HTTP 请求并返回响应给客户端。

### 基础控制器

```typescript
// user.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')  // 路由前缀: /users
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED)  // 返回 201 状态码
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // PUT /users/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)  // 返回 204 状态码
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
```

### 请求参数装饰器

```typescript
import { 
  Param, Query, Body, Headers, Ip, 
  Req, Res, Session, HostParam 
} from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('demo')
export class DemoController {
  
  // 路径参数: /demo/123
  @Get(':id')
  getById(@Param('id') id: string) {
    return { id };
  }

  // 多个路径参数: /demo/123/comments/456
  @Get(':id/comments/:commentId')
  getComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return { id, commentId };
  }

  // 查询参数: /demo?page=1&limit=10
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() allQuery: any,  // 获取所有查询参数
  ) {
    return { page, limit, allQuery };
  }

  // 请求体
  @Post()
  create(@Body() body: CreateDto) {
    return body;
  }

  // 部分请求体
  @Post('partial')
  createPartial(@Body('name') name: string) {
    return { name };
  }

  // 请求头
  @Get('headers')
  getHeaders(
    @Headers('authorization') auth: string,
    @Headers() allHeaders: any,
  ) {
    return { auth, allHeaders };
  }

  // 客户端 IP
  @Get('ip')
  getIp(@Ip() ip: string) {
    return { ip };
  }

  // 原生请求/响应对象
  @Get('native')
  getNative(@Req() req: Request, @Res() res: Response) {
    res.status(200).json({ message: 'Native response' });
  }
}
```

### 路由通配符和正则

```typescript
@Controller('files')
export class FileController {
  
  // 通配符路由: /files/ab*cd 匹配 /files/abcd, /files/ab123cd 等
  @Get('ab*cd')
  findWildcard() {
    return 'This route uses a wildcard';
  }

  // 可选参数: /files 或 /files/123
  @Get(':id?')
  findOptional(@Param('id') id?: string) {
    return id ? `File ${id}` : 'All files';
  }
}
```

### 子路由（嵌套路由）

```typescript
// 方式一：在同一控制器中定义
@Controller('users')
export class UserController {
  
  @Get(':userId/posts')
  getUserPosts(@Param('userId') userId: string) {
    return `Posts of user ${userId}`;
  }

  @Get(':userId/posts/:postId')
  getUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    return `Post ${postId} of user ${userId}`;
  }
}

// 方式二：独立的子资源控制器
@Controller('users/:userId/posts')
export class UserPostController {
  
  @Get()
  findAll(@Param('userId') userId: string) {
    return `All posts of user ${userId}`;
  }

  @Get(':postId')
  findOne(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    return `Post ${postId} of user ${userId}`;
  }
}
```

---

## Service（服务）

服务负责处理业务逻辑，是应用程序的核心。服务可以被注入到控制器或其他服务中。

### 基础服务

```typescript
// user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

@Injectable()  // 标记为可注入的服务
export class UserService {
  private users: User[] = [];
  private idCounter = 1;

  // 查询所有用户
  findAll(): User[] {
    return this.users;
  }

  // 根据 ID 查询
  findOne(id: number): User {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  // 根据条件查询
  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  // 创建用户
  create(createUserDto: CreateUserDto): User {
    const user: User = {
      id: this.idCounter++,
      ...createUserDto,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  // 更新用户
  update(id: number, updateUserDto: UpdateUserDto): User {
    const user = this.findOne(id);
    Object.assign(user, updateUserDto);
    return user;
  }

  // 删除用户
  remove(id: number): void {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User #${id} not found`);
    }
    this.users.splice(index, 1);
  }
}
```

### 服务之间的依赖

```typescript
// email.service.ts
@Injectable()
export class EmailService {
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    console.log(`Sending welcome email to ${email}`);
    // 实际发送邮件的逻辑
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    console.log(`Sending reset password email to ${email}`);
  }
}

// user.service.ts
@Injectable()
export class UserService {
  constructor(
    private readonly emailService: EmailService,  // 注入 EmailService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = { id: Date.now(), ...createUserDto, createdAt: new Date() };
    
    // 调用邮件服务
    await this.emailService.sendWelcomeEmail(user.email, user.username);
    
    return user;
  }
}
```

### 异步服务方法

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 异步方法返回 Promise
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // 使用事务
  async transferBalance(fromId: number, toId: number, amount: number): Promise<void> {
    await this.userRepository.manager.transaction(async manager => {
      const from = await manager.findOneBy(User, { id: fromId });
      const to = await manager.findOneBy(User, { id: toId });
      
      from.balance -= amount;
      to.balance += amount;
      
      await manager.save([from, to]);
    });
  }
}
```

---

## Module（模块）

模块是组织应用程序结构的基本单元。每个 NestJS 应用至少有一个根模块（AppModule）。

### 模块结构

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // 导入其他模块
  ],
  controllers: [UserController],        // 声明控制器
  providers: [UserService],             // 声明服务提供者
  exports: [UserService],               // 导出给其他模块使用
})
export class UserModule {}
```

### 模块装饰器属性

| 属性 | 说明 |
|------|------|
| `imports` | 导入其他模块，使其导出的 providers 可用 |
| `controllers` | 此模块中定义的控制器 |
| `providers` | 此模块中定义的服务提供者 |
| `exports` | 此模块导出的 providers，供其他模块使用 |

### 功能模块示例

```
src/
├── app.module.ts           # 根模块
├── user/
│   ├── user.module.ts      # 用户模块
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── post/
│   ├── post.module.ts      # 文章模块
│   ├── post.controller.ts
│   ├── post.service.ts
│   └── post.entity.ts
└── common/
    ├── common.module.ts    # 公共模块
    └── services/
        └── logger.service.ts
```

### 根模块

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // 配置模块（全局）
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // 数据库模块
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'nestjs_demo',
      autoLoadEntities: true,
      synchronize: true,
    }),
    
    // 功能模块
    CommonModule,
    UserModule,
    PostModule,
  ],
})
export class AppModule {}
```

### 共享模块

创建一个可以在多个模块之间共享的模块：

```typescript
// common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { UtilService } from './services/util.service';

@Global()  // 标记为全局模块，无需在其他模块中 import
@Module({
  providers: [LoggerService, UtilService],
  exports: [LoggerService, UtilService],  // 导出供其他模块使用
})
export class CommonModule {}
```

```typescript
// 在其他服务中使用（无需 import CommonModule）
@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerService,  // 直接注入
  ) {}
}
```

### 动态模块

动态模块允许在导入时传递配置：

```typescript
// database.module.ts
import { Module, DynamicModule } from '@nestjs/common';

interface DatabaseModuleOptions {
  host: string;
  port: number;
  database: string;
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
      global: true,  // 设为全局模块
    };
  }
}

// 使用
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 3306,
      database: 'nestjs_demo',
    }),
  ],
})
export class AppModule {}
```

---

## 完整示例：用户管理模块

### 目录结构

```
src/user/
├── user.module.ts
├── user.controller.ts
├── user.service.ts
├── user.entity.ts
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    └── user-response.dto.ts
```

### DTO 定义

```typescript
// dto/create-user.dto.ts
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

// dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

// dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Exclude()  // 不返回密码
  password: string;

  @Expose()
  createdAt: Date;
}
```

### Entity 定义

```typescript
// user.entity.ts
import { 
  Entity, Column, PrimaryGeneratedColumn, 
  CreateDateColumn, UpdateDateColumn 
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Service 实现

```typescript
// user.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { status: 1 },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    // 软删除
    user.status = 0;
    await this.userRepository.save(user);
  }
}
```

### Controller 实现

```typescript
// user.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Param, Query, Body, ParseIntPipe,
  HttpCode, HttpStatus, UseInterceptors, ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { User } from './user.entity';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)  // 启用序列化
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }
}
```

### Module 定义

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],  // 如果其他模块需要使用 UserService
})
export class UserModule {}
```

---

## 下一步学习

- **04_nestjs_di.md** - 依赖注入与自定义 Provider
- **05_nestjs_middleware.md** - 中间件、拦截器、管道、守卫

---

## 练习任务

1. 创建一个完整的 `PostModule`，包含 Controller、Service、Entity
2. 实现用户和文章的关联（一对多关系）
3. 添加分页查询功能
4. 使用 DTO 进行请求验证和响应序列化

