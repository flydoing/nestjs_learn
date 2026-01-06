# NestJS 依赖注入与 Provider

> 深入理解 NestJS 的依赖注入系统

## 什么是依赖注入（DI）？

依赖注入是一种设计模式，用于实现控制反转（IoC）。简单来说，就是**不在类内部创建依赖，而是从外部注入**。

### 没有依赖注入

```typescript
// ❌ 传统方式：类自己创建依赖
class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();  // 紧耦合
  }
}
```

### 使用依赖注入

```typescript
// ✅ 依赖注入：依赖从外部传入
class UserController {
  constructor(private userService: UserService) {}  // 松耦合
}
```

### 依赖注入的好处

1. **松耦合**：类不需要知道依赖的具体实现
2. **可测试**：可以轻松注入 Mock 对象进行单元测试
3. **可维护**：修改依赖不影响使用它的类
4. **可复用**：同一个服务可以注入到多个地方

---

## Provider 基础

在 NestJS 中，Provider 是可以被注入的类或值。最常见的 Provider 就是 Service。

### 标准 Provider

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()  // 声明为可注入的 Provider
export class UserService {
  findAll() {
    return ['user1', 'user2'];
  }
}

// user.module.ts
@Module({
  providers: [UserService],  // 注册 Provider
  controllers: [UserController],
})
export class UserModule {}
```

上面的写法是简写，完整写法是：

```typescript
@Module({
  providers: [
    {
      provide: UserService,      // Token（标识符）
      useClass: UserService,     // 具体的类
    }
  ],
})
export class UserModule {}
```

---

## Provider 的类型

NestJS 支持多种 Provider 类型：

### 1. useClass - 类 Provider

最常见的类型，使用类作为 Provider。

```typescript
// 标准用法
@Module({
  providers: [UserService],  // 简写
})

// 完整写法
@Module({
  providers: [
    {
      provide: UserService,
      useClass: UserService,
    }
  ],
})

// 替换实现（在测试或不同环境中使用不同实现）
@Module({
  providers: [
    {
      provide: UserService,
      useClass: process.env.NODE_ENV === 'test' 
        ? MockUserService 
        : UserService,
    }
  ],
})
```

### 2. useValue - 值 Provider

直接提供一个值。

```typescript
// 提供配置对象
const configValue = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: configValue,
    }
  ],
})

// 使用
@Injectable()
export class AppService {
  constructor(@Inject('CONFIG') private config: any) {
    console.log(this.config.apiUrl);
  }
}
```

### 3. useFactory - 工厂 Provider

使用工厂函数动态创建 Provider，可以依赖其他 Provider。

```typescript
// 基础工厂
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        return createConnection({
          host: 'localhost',
          port: 3306,
        });
      },
    }
  ],
})

// 带依赖的工厂
@Module({
  providers: [
    ConfigService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (configService: ConfigService) => {
        return createConnection({
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
        });
      },
      inject: [ConfigService],  // 注入依赖
    }
  ],
})

// 异步工厂
@Module({
  providers: [
    {
      provide: 'ASYNC_SERVICE',
      useFactory: async (configService: ConfigService) => {
        const connection = await createAsyncConnection();
        return new AsyncService(connection);
      },
      inject: [ConfigService],
    }
  ],
})
```

### 4. useExisting - 别名 Provider

为现有 Provider 创建别名。

```typescript
@Module({
  providers: [
    UserService,
    {
      provide: 'AliasUserService',
      useExisting: UserService,  // 指向同一个实例
    }
  ],
})

// 使用
@Injectable()
export class AppService {
  constructor(
    private userService: UserService,
    @Inject('AliasUserService') private aliasService: UserService,
  ) {
    // userService 和 aliasService 是同一个实例
    console.log(userService === aliasService);  // true
  }
}
```

---

## 注入令牌（Injection Token）

### 字符串令牌

```typescript
@Module({
  providers: [
    {
      provide: 'API_KEY',
      useValue: 'secret-api-key',
    }
  ],
})

// 使用
@Injectable()
export class AppService {
  constructor(@Inject('API_KEY') private apiKey: string) {}
}
```

### Symbol 令牌

```typescript
// constants.ts
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

// module
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useValue: connection,
    }
  ],
})

// 使用
@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: Connection,
  ) {}
}
```

### 类令牌（推荐）

```typescript
// 接口 + 抽象类
abstract class AbstractUserService {
  abstract findAll(): User[];
}

// 实现
@Injectable()
class UserService extends AbstractUserService {
  findAll() {
    return [];
  }
}

// 模块
@Module({
  providers: [
    {
      provide: AbstractUserService,
      useClass: UserService,
    }
  ],
})

// 使用
@Injectable()
export class AppService {
  constructor(private userService: AbstractUserService) {}
}
```

---

## 作用域（Scope）

NestJS Provider 有三种作用域：

### 1. DEFAULT（单例）

默认作用域，整个应用共享一个实例。

```typescript
@Injectable()  // 默认就是单例
export class UserService {}

// 或显式声明
@Injectable({ scope: Scope.DEFAULT })
export class UserService {}
```

### 2. REQUEST

每个请求创建新实例。

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {
    // 可以访问当前请求对象
    console.log('Request URL:', this.request.url);
  }
}
```

### 3. TRANSIENT

每次注入创建新实例。

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  private id = Math.random();
  
  getId() {
    return this.id;
  }
}

// 每次注入都是不同实例
@Injectable()
export class ConsumerService {
  constructor(
    private service1: TransientService,
    private service2: TransientService,
  ) {
    console.log(service1.getId() === service2.getId());  // false
  }
}
```

### 作用域传播

如果一个 Provider 依赖了 REQUEST 或 TRANSIENT 作用域的 Provider，它也会变成相应的作用域。

```typescript
// RequestService 是 REQUEST 作用域
@Injectable({ scope: Scope.REQUEST })
export class RequestService {}

// UserService 依赖 RequestService，自动变成 REQUEST 作用域
@Injectable()
export class UserService {
  constructor(private requestService: RequestService) {}
}
```

---

## 自定义 Provider 实践

### 配置服务

```typescript
// config.interface.ts
export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

// config.provider.ts
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';

export const configProvider = {
  provide: CONFIG_OPTIONS,
  useFactory: (): AppConfig => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      name: process.env.DB_NAME || 'nestjs_demo',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  }),
};

// 使用
@Injectable()
export class AppService {
  constructor(@Inject(CONFIG_OPTIONS) private config: AppConfig) {
    console.log(`Server running on port ${this.config.port}`);
  }
}
```

### 日志服务

```typescript
// logger.interface.ts
export interface LoggerService {
  log(message: string): void;
  error(message: string, trace?: string): void;
  warn(message: string): void;
  debug(message: string): void;
}

// console-logger.service.ts
@Injectable()
export class ConsoleLoggerService implements LoggerService {
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
}

// file-logger.service.ts
@Injectable()
export class FileLoggerService implements LoggerService {
  log(message: string) {
    // 写入文件
  }
  // ...
}

// logger.module.ts
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useClass: process.env.NODE_ENV === 'production'
        ? FileLoggerService
        : ConsoleLoggerService,
    }
  ],
  exports: ['LoggerService'],
})
export class LoggerModule {}

// 使用
@Injectable()
export class UserService {
  constructor(@Inject('LoggerService') private logger: LoggerService) {}
  
  findAll() {
    this.logger.log('Finding all users');
    return [];
  }
}
```

### 数据库连接

```typescript
// database.providers.ts
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
      });
      return dataSource.initialize();
    },
  },
];

// database.module.ts
@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}

// user.providers.ts
export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
];

// user.service.ts
@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
  ) {}
}
```

---

## 可选依赖

使用 `@Optional()` 装饰器处理可选依赖：

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService {
  constructor(
    @Optional() @Inject('HTTP_OPTIONS') private options?: HttpOptions,
  ) {
    // 如果没有提供 HTTP_OPTIONS，options 为 undefined
    this.options = options || { timeout: 5000 };
  }
}
```

---

## 循环依赖

当两个类相互依赖时，会产生循环依赖。使用 `forwardRef` 解决：

```typescript
// user.service.ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PostService } from './post.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => PostService))
    private postService: PostService,
  ) {}
}

// post.service.ts
@Injectable()
export class PostService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}
}

// 模块级别的循环依赖
@Module({
  imports: [forwardRef(() => PostModule)],
})
export class UserModule {}

@Module({
  imports: [forwardRef(() => UserModule)],
})
export class PostModule {}
```

> ⚠️ 尽量避免循环依赖，它通常表明代码结构需要重构。

---

## 测试中的 Provider

依赖注入使单元测试变得简单：

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

describe('UserService', () => {
  let service: UserService;

  // Mock Repository
  const mockRepository = {
    find: jest.fn().mockResolvedValue([{ id: 1, username: 'test' }]),
    findOneBy: jest.fn().mockResolvedValue({ id: 1, username: 'test' }),
    save: jest.fn().mockImplementation(user => Promise.resolve({ id: 1, ...user })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,  // 使用 Mock
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should find all users', async () => {
    const users = await service.findAll();
    expect(users).toHaveLength(1);
    expect(mockRepository.find).toHaveBeenCalled();
  });

  it('should find one user', async () => {
    const user = await service.findOne(1);
    expect(user.username).toBe('test');
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });
});
```

---

## 下一步学习

- **05_nestjs_middleware.md** - 中间件、拦截器、管道、守卫

---

## 练习任务

1. 创建一个自定义 Logger Provider，支持不同环境使用不同实现
2. 使用 useFactory 创建数据库连接 Provider
3. 实现一个配置服务，从环境变量读取配置
4. 为 UserService 编写单元测试，使用 Mock 注入

