# NestJS 配置管理

> 使用 ConfigModule 管理环境变量和应用配置

## 为什么需要配置管理？

在开发中，不同环境（开发、测试、生产）需要不同的配置：
- 数据库连接信息
- API 密钥
- 端口号
- 第三方服务地址

硬编码这些值会导致：
- ❌ 代码不灵活
- ❌ 安全性问题（密钥泄露）
- ❌ 难以切换环境

---

## ConfigModule 基础

### 安装

```bash
npm install @nestjs/config
```

### 基础配置

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // 全局模块，其他模块无需导入
      envFilePath: '.env',  // 环境变量文件路径
    }),
  ],
})
export class AppModule {}
```

### 使用配置

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {}

  getDatabaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST', 'localhost');
    //                                              ↑ 默认值
  }

  getPort(): number {
    return this.configService.get<number>('PORT', 3000);
  }
}
```

---

## 环境变量文件

### .env 文件结构

```bash
# .env
NODE_ENV=development
PORT=3000

# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=123456
DATABASE_NAME=nestjs_demo

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 配置
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# 第三方服务
API_KEY=your-api-key
```

### 多环境配置

```bash
# .env.development
DATABASE_HOST=localhost
DATABASE_NAME=nestjs_dev

# .env.production
DATABASE_HOST=prod-db.example.com
DATABASE_NAME=nestjs_prod
```

```typescript
// app.module.ts
ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
  isGlobal: true,
})
```

---

## 配置验证

### 使用 Joi 验证配置

```bash
npm install joi
```

```typescript
// app.module.ts
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(3306),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,  // 允许未知环境变量
        abortEarly: true,   // 遇到第一个错误就停止
      },
    }),
  ],
})
export class AppModule {}
```

---

## 配置命名空间

### 创建配置命名空间

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
}));

// config/jwt.config.ts
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));
```

### 注册命名空间

```typescript
// app.module.ts
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],  // 加载命名空间
    }),
  ],
})
export class AppModule {}
```

### 使用命名空间

```typescript
// user.service.ts
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {}

  getDatabaseConfig() {
    return this.configService.get('database');  // 获取整个命名空间
  }

  getJwtSecret() {
    return this.configService.get('jwt.secret');  // 获取命名空间下的属性
  }
}
```

---

## TypeScript 类型安全

### 定义配置接口

```typescript
// config/config.interface.ts
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  jwt: JwtConfig;
}
```

### 使用类型

```typescript
// user.service.ts
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './config/config.interface';

@Injectable()
export class UserService {
  constructor(private configService: ConfigService) {}

  getDatabaseConfig(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('database', {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'nestjs_demo',
    });
  }
}
```

---

## 实际应用示例

### TypeORM 配置

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}));

// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => 
        configService.get('database'),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Redis 配置

```typescript
// config/redis.config.ts
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
}));
```

---

## 配置最佳实践

### 1. .gitignore 配置

```bash
# .gitignore
.env
.env.local
.env.*.local
.env.production
```

### 2. 提供 .env.example

```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=nestjs_demo
JWT_SECRET=your-secret-key
```

### 3. 环境变量命名规范

```bash
# 使用大写字母和下划线
DATABASE_HOST=localhost
REDIS_HOST=localhost
JWT_SECRET=secret

# 分组命名
DATABASE_HOST
DATABASE_PORT
DATABASE_USER

REDIS_HOST
REDIS_PORT
```

---

## 下一步学习

- **08_nestjs_logging.md** - 日志系统
- **09_nestjs_testing.md** - 单元测试与 E2E 测试
- **10_mysql_basics.md** - MySQL 数据库基础

---

## 练习任务

1. 配置 ConfigModule，支持多环境（development/production）
2. 使用 Joi 验证环境变量
3. 创建数据库和 JWT 配置命名空间
4. 在 TypeORM 中使用配置服务

