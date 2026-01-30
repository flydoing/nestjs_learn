# NestJS 异常处理与过滤器

> 统一处理应用中的各种异常，返回友好的错误响应

## 异常处理概览

在 NestJS 中，异常处理通过 **Exception Filters（异常过滤器）** 实现，可以统一处理所有异常并返回标准化的错误响应。

### 异常处理流程

```
请求 → Controller → Service → 抛出异常
                              ↓
                        异常过滤器捕获
                              ↓
                        格式化错误响应
                              ↓
                        返回给客户端
```

---

## 内置异常类

NestJS 提供了多个内置异常类，对应不同的 HTTP 状态码：

### 常用内置异常

```typescript
import {
  BadRequestException,        // 400 - 请求错误
  UnauthorizedException,       // 401 - 未授权
  ForbiddenException,          // 403 - 禁止访问
  NotFoundException,           // 404 - 资源不存在
  ConflictException,           // 409 - 资源冲突
  InternalServerErrorException, // 500 - 服务器错误
} from '@nestjs/common';
```

### 使用示例

```typescript
// user.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class UserService {
  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`用户 #${id} 不存在`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepository.findOneBy({ 
      email: createUserDto.email 
    });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }
    return this.userRepository.save(createUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id); // 如果不存在会抛出 NotFoundException
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }
}
```

### 异常响应格式（默认）

```json
{
  "statusCode": 404,
  "message": "用户 #1 不存在",
  "error": "Not Found"
}
```

---

## 自定义异常过滤器

### 基础异常过滤器

```typescript
// http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      code: status,
      success: false,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    response.status(status).json(errorResponse);
  }
}
```

### 捕获所有异常

```typescript
// all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()  // 不传参数，捕获所有异常
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    // 记录错误日志
    console.error('Exception:', exception);
    if (exception instanceof Error) {
      console.error('Stack:', exception.stack);
    }

    response.status(status).json({
      code: status,
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}
```

### 应用异常过滤器

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局异常过滤器（捕获所有异常）
  app.useGlobalFilters(new AllExceptionsFilter());

  // 或者只捕获 HTTP 异常
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
```

### 模块级别应用

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

---

## 自定义异常类

### 创建业务异常

```typescript
// exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code?: number) {
    super(
      {
        code: code || HttpStatus.BAD_REQUEST,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 使用
throw new BusinessException('业务逻辑错误', 4001);
```

### 创建多个业务异常

```typescript
// exceptions/user.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(userId: number) {
    super(
      {
        code: 40401,
        message: `用户 #${userId} 不存在`,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UserEmailExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        code: 40901,
        message: `邮箱 ${email} 已被注册`,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }
}

// 使用
throw new UserNotFoundException(1);
throw new UserEmailExistsException('test@example.com');
```

---

## 异常处理最佳实践

### 1. 统一错误响应格式

```typescript
// common/interfaces/error-response.interface.ts
export interface ErrorResponse {
  code: number;
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path?: string;
}
```

### 2. 分层异常处理

```typescript
// Service 层：抛出业务异常
@Injectable()
export class UserService {
  async findOne(id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UserNotFoundException(id);  // 业务异常
    }
    return user;
  }
}

// Controller 层：捕获并处理（可选）
@Controller('users')
export class UserController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.userService.findOne(+id);
    } catch (error) {
      // 可以在这里做额外处理，或交给全局过滤器
      throw error;
    }
  }
}
```

### 3. 错误日志记录

```typescript
// all-exceptions.filter.ts
import { Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    
    // 记录错误日志
    this.logger.error(
      `Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      exception instanceof Error ? exception.stack : undefined,
      `${request.method} ${request.url}`,
    );

    // ... 返回错误响应
  }
}
```

---

## 实际应用示例

### 完整的异常处理系统

```typescript
// filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 提取错误信息
    const message = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as any).message;

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );

    // 返回统一格式
    response.status(status).json({
      code: status,
      success: false,
      message: Array.isArray(message) ? message.join('，') : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

// filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    // 记录详细错误
    this.logger.error(
      `Unexpected error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      `${request.method} ${request.url}`,
    );

    response.status(status).json({
      code: status,
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

---

## 下一步学习

- **07_nestjs_config.md** - 配置管理（ConfigModule）
- **08_nestjs_logging.md** - 日志系统
- **10_mysql_basics.md** - MySQL 数据库基础

---

## 练习任务

1. 创建全局异常过滤器，统一错误响应格式
2. 创建自定义业务异常类（UserNotFoundException、EmailExistsException）
3. 在 Service 中使用自定义异常
4. 配置错误日志记录

