# NestJS 日志系统

> 使用 Logger 记录应用运行日志，便于调试和问题排查

## 为什么需要日志？

日志系统可以帮助你：
- 🔍 **调试问题**：追踪错误发生的位置和原因
- 📊 **监控应用**：了解应用运行状态和性能
- 🚨 **错误追踪**：记录异常和错误信息
- 📈 **数据分析**：分析用户行为和系统性能

---

## NestJS 内置 Logger

### 基础使用

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  findAll() {
    this.logger.log('查询所有用户');
    return [];
  }

  findOne(id: number) {
    this.logger.log(`查询用户 #${id}`);
    return {};
  }

  create(createUserDto: CreateUserDto) {
    this.logger.log(`创建用户: ${createUserDto.username}`);
    return {};
  }
}
```

### 日志级别

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  example() {
    // 普通信息
    this.logger.log('这是一条日志信息');
    
    // 警告
    this.logger.warn('这是一条警告信息');
    
    // 错误
    this.logger.error('这是一条错误信息', error.stack);
    
    // 调试信息
    this.logger.debug('这是一条调试信息');
    
    // 详细信息
    this.logger.verbose('这是一条详细信息');
  }
}
```

### 日志输出示例

```
[Nest] 12345  - 01/15/2026, 10:30:00 AM     LOG [UserService] 查询所有用户
[Nest] 12345  - 01/15/2026, 10:30:01 AM     WARN [UserService] 用户不存在
[Nest] 12345  - 01/15/2026, 10:30:02 AM     ERROR [UserService] 数据库连接失败
```

---

## 全局日志配置

### 在 main.ts 中配置

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],  // 所有级别
    // 或
    // logger: ['error', 'warn'],  // 只记录错误和警告
  });

  const logger = new Logger('Bootstrap');
  logger.log('应用启动成功');

  await app.listen(3000);
}
bootstrap();
```

### 自定义日志格式

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger('App', {
      timestamp: true,  // 显示时间戳
    }),
  });

  await app.listen(3000);
}
bootstrap();
```

---

## 自定义 Logger

### 创建自定义 Logger

```typescript
// common/logger/custom-logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }

  error(message: string, trace?: string) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (trace) console.error(trace);
  }

  warn(message: string) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`);
  }

  debug(message: string) {
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
  }

  verbose(message: string) {
    console.log(`[VERBOSE] ${new Date().toISOString()} - ${message}`);
  }
}
```

### 使用自定义 Logger

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CustomLogger } from './common/logger/custom-logger.service';

@Module({
  providers: [
    CustomLogger,
    {
      provide: APP_FILTER,
      useClass: CustomLogger,
    },
  ],
})
export class AppModule {}
```

---

## 文件日志（Winston）

### 安装 Winston

```bash
npm install nest-winston winston
```

### 配置 Winston

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        // 文件输出 - 所有日志
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        // 文件输出 - 错误日志
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  await app.listen(3000);
}
bootstrap();
```

### 使用 Winston Logger

```typescript
// user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  findAll() {
    this.logger.info('查询所有用户', { context: 'UserService' });
    return [];
  }

  findOne(id: number) {
    this.logger.info(`查询用户 #${id}`, { context: 'UserService' });
    return {};
  }
}
```

---

## 日志最佳实践

### 1. 结构化日志

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  create(createUserDto: CreateUserDto) {
    this.logger.log({
      message: '创建用户',
      username: createUserDto.username,
      email: createUserDto.email,
    });
  }
}
```

### 2. 错误日志记录

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findOne(id: number) {
    try {
      return await this.userRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(
        `查询用户失败: ${error.message}`,
        error.stack,
        'UserService.findOne',
      );
      throw error;
    }
  }
}
```

### 3. 性能日志

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findAll() {
    const start = Date.now();
    
    const users = await this.userRepository.find();
    
    const duration = Date.now() - start;
    this.logger.log(`查询用户列表耗时: ${duration}ms`);
    
    return users;
  }
}
```

### 4. 请求日志拦截器

```typescript
// interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
```

---

## 日志级别说明

| 级别 | 用途 | 示例 |
|------|------|------|
| `log` | 一般信息 | 用户登录、数据查询 |
| `error` | 错误信息 | 异常、数据库连接失败 |
| `warn` | 警告信息 | 资源不存在、参数异常 |
| `debug` | 调试信息 | 变量值、执行流程 |
| `verbose` | 详细信息 | 详细的执行步骤 |

---

## 下一步学习

- **09_nestjs_testing.md** - 单元测试与 E2E 测试
- **10_mysql_basics.md** - MySQL 数据库基础

---

## 练习任务

1. 在 Service 中添加日志记录
2. 配置 Winston 文件日志
3. 创建请求日志拦截器
4. 实现错误日志记录

