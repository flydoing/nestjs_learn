# NestJS 中间件、拦截器、管道、守卫

> 理解 NestJS 请求生命周期中的各种处理组件

## 请求生命周期

在 NestJS 中，一个请求会经过多个处理阶段：

```
请求进入
    ↓
中间件 (Middleware)
    ↓
守卫 (Guards)
    ↓
拦截器 (Interceptors) - 前置处理
    ↓
管道 (Pipes)
    ↓
控制器方法 (Controller)
    ↓
拦截器 (Interceptors) - 后置处理
    ↓
异常过滤器 (Exception Filters)
    ↓
响应返回
```

### 各组件职责

| 组件 | 职责 | 前端类比 |
|------|------|---------|
| Middleware | 通用请求处理 | Vue Router 的全局导航守卫 |
| Guards | 权限验证、认证 | Vue Router 的路由守卫 |
| Interceptors | 请求/响应转换、日志、缓存 | Axios 拦截器 |
| Pipes | 数据转换和验证 | Vue 的 computed/filter |
| Exception Filters | 异常处理 | Vue 的 errorHandler |

---

## Middleware（中间件）

中间件是在路由处理程序之前调用的函数，可以访问请求和响应对象。

### 函数式中间件

```typescript
// logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

// 在 main.ts 中使用
app.use(loggerMiddleware);
```

### 类中间件

```typescript
// auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      // 验证 token
      const decoded = this.verifyToken(token);
      req['user'] = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
  
  private verifyToken(token: string) {
    // JWT 验证逻辑
    return { userId: 1, username: 'test' };
  }
}
```

### 应用中间件

```typescript
// app.module.ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

@Module({
  imports: [UserModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 应用到所有路由
      .apply(LoggerMiddleware)
      .forRoutes('*')
      
      // 应用到特定路由
      .apply(AuthMiddleware)
      .forRoutes('users', 'posts')
      
      // 应用到特定方法和路由
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.POST },
        { path: 'users/:id', method: RequestMethod.PUT },
        { path: 'users/:id', method: RequestMethod.DELETE },
      )
      
      // 排除某些路由
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
```

### 常用中间件

```typescript
// cors.middleware.ts - CORS 中间件
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
}

// request-id.middleware.ts - 请求 ID 中间件
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req['requestId'] = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req['requestId']);
  next();
}
```

---

## Guards（守卫）

守卫用于权限控制，决定请求是否应该被处理。

### 基础守卫

```typescript
// auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    // 验证 token 并返回 true/false
    return this.validateToken(token);
  }
  
  private validateToken(token: string): boolean {
    // JWT 验证逻辑
    return true;
  }
}
```

### 使用守卫

```typescript
// 控制器级别
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {}

// 方法级别
@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return [];  // 公开接口
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateUserDto) {
    return {};  // 需要认证
  }
}

// 全局级别（main.ts）
app.useGlobalGuards(new AuthGuard());

// 全局级别（模块注入，推荐）
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
```

### 角色守卫

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;  // 没有设置角色要求，允许访问
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return requiredRoles.some(role => user?.roles?.includes(role));
  }
}

// 使用
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  @Get()
  @Roles('admin')
  getAdminDashboard() {
    return 'Admin Dashboard';
  }

  @Get('users')
  @Roles('admin', 'moderator')
  getUsers() {
    return 'Users list';
  }
}
```

---

## Interceptors（拦截器）

拦截器可以在方法执行前后添加额外的逻辑。

### 基础拦截器

```typescript
// logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    console.log(`[Request] ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        console.log(`[Response] ${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
```

### 响应转换拦截器

```typescript
// transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 200,
        message: 'success',
        data,
      })),
    );
  }
}

// 响应结果
// 原本: { id: 1, name: 'test' }
// 转换后: { code: 200, message: 'success', data: { id: 1, name: 'test' } }
```

### 缓存拦截器

```typescript
// cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = request.url;

    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log(`Cache hit: ${cacheKey}`);
      return of(this.cache.get(cacheKey));
    }

    // 执行请求并缓存结果
    return next.handle().pipe(
      tap(response => {
        this.cache.set(cacheKey, response);
        // 5分钟后清除缓存
        setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      }),
    );
  }
}
```

### 超时拦截器

```typescript
// timeout.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}
```

### 使用拦截器

```typescript
// 方法级别
@Get()
@UseInterceptors(LoggingInterceptor)
findAll() {}

// 控制器级别
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UserController {}

// 全局级别
app.useGlobalInterceptors(new LoggingInterceptor());

// 全局级别（模块注入）
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## Pipes（管道）

管道用于数据转换和验证。

### 内置管道

NestJS 提供了多个内置管道：

```typescript
import {
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  ParseArrayPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  DefaultValuePipe,
  ValidationPipe,
} from '@nestjs/common';

@Controller('users')
export class UserController {
  // ParseIntPipe - 转换为整数
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // ParseBoolPipe - 转换为布尔值
  @Get()
  findAll(@Query('active', ParseBoolPipe) active: boolean) {
    return this.userService.findAll({ active });
  }

  // DefaultValuePipe - 默认值
  @Get()
  findWithDefault(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.userService.findAll({ page, limit });
  }

  // ParseUUIDPipe - UUID 验证
  @Get(':uuid')
  findByUUID(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.userService.findByUUID(uuid);
  }

  // ParseEnumPipe - 枚举验证
  @Get('status/:status')
  findByStatus(@Param('status', new ParseEnumPipe(UserStatus)) status: UserStatus) {
    return this.userService.findByStatus(status);
  }
}
```

### 自定义管道

```typescript
// parse-int.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class CustomParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException(`${metadata.data} must be a number`);
    }
    return val;
  }
}

// trim.pipe.ts - 去除字符串空格
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => {
        if (typeof value[key] === 'string') {
          value[key] = value[key].trim();
        }
      });
    }
    return value;
  }
}
```

### ValidationPipe（验证管道）

```typescript
// 安装依赖
// npm install class-validator class-transformer

// create-user.dto.ts
import { IsString, IsEmail, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: '用户名至少2个字符' })
  @Transform(({ value }) => value?.trim())  // 自动去除空格
  username: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  @Type(() => Number)  // 自动转换类型
  age?: number;
}

// 全局启用验证管道（main.ts）
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // 过滤掉 DTO 中未定义的属性
  transform: true,           // 自动转换类型
  forbidNonWhitelisted: true, // 存在未定义属性时抛出错误
  transformOptions: {
    enableImplicitConversion: true,  // 隐式类型转换
  },
}));
```

### 自定义验证装饰器

```typescript
// is-unique.decorator.ts
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validate(value: any, args: ValidationArguments) {
    const [property] = args.constraints;
    const user = await this.userRepository.findOneBy({ [property]: value });
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} already exists`;
  }
}

export function IsUnique(property: string, options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: options,
      constraints: [property],
      validator: IsUniqueConstraint,
    });
  };
}

// 使用
export class CreateUserDto {
  @IsEmail()
  @IsUnique('email')
  email: string;
}
```

---

## Exception Filters（异常过滤器）

异常过滤器用于处理应用程序中的异常。

### 内置异常

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// 使用内置异常
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid request data');
throw new UnauthorizedException('Please login first');
throw new ForbiddenException('Access denied');
```

### 自定义异常过滤器

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

// 捕获所有异常
@Catch()
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

    console.error('Exception:', exception);

    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 使用异常过滤器

```typescript
// 方法级别
@Get(':id')
@UseFilters(HttpExceptionFilter)
findOne(@Param('id') id: string) {}

// 控制器级别
@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {}

// 全局级别
app.useGlobalFilters(new HttpExceptionFilter());

// 全局级别（模块注入）
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

## 完整示例：请求处理流程

```typescript
// 1. 中间件 - 记录请求
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('1. Middleware: Request received');
    next();
  }
}

// 2. 守卫 - 验证权限
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    console.log('2. Guard: Checking authorization');
    return true;
  }
}

// 3. 拦截器 - 前后处理
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('3. Interceptor: Before handler');
    return next.handle().pipe(
      tap(() => console.log('6. Interceptor: After handler')),
    );
  }
}

// 4. 管道 - 数据验证
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log('4. Pipe: Validating data');
    return value;
  }
}

// 5. 控制器处理
@Controller('demo')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class DemoController {
  @Get(':id')
  @UsePipes(ValidationPipe)
  findOne(@Param('id') id: string) {
    console.log('5. Controller: Handling request');
    return { id };
  }
}

// 输出顺序:
// 1. Middleware: Request received
// 2. Guard: Checking authorization
// 3. Interceptor: Before handler
// 4. Pipe: Validating data
// 5. Controller: Handling request
// 6. Interceptor: After handler
```

---

## 下一步学习

- **06_nestjs_exception.md** - 异常处理与自定义异常
- **10_mysql_basics.md** - MySQL 数据库基础

---

## 练习任务

1. 实现一个日志中间件，记录所有请求的方法、URL 和响应时间
2. 创建一个 JWT 认证守卫
3. 实现一个响应转换拦截器，统一响应格式
4. 使用 ValidationPipe 实现请求参数验证
5. 创建一个全局异常过滤器，统一错误响应格式

