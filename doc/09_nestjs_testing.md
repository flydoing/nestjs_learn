# NestJS 测试

> 编写单元测试和 E2E 测试，保证代码质量

## 测试类型

NestJS 支持两种测试：

| 测试类型 | 测试范围 | 文件位置 |
|---------|---------|---------|
| **单元测试** | 单个类/方法 | `*.spec.ts` |
| **E2E 测试** | 完整请求流程 | `test/*.e2e-spec.ts` |

---

## 单元测试

### 测试文件结构

NestJS CLI 会自动生成测试文件：

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### 测试 Service

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  // Mock Repository
  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, username: 'test' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: 1, username: 'test' };
      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOne(1);
      expect(result).toEqual(user);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = { username: 'test', email: 'test@example.com', password: '123456' };
      const user = { id: 1, ...createUserDto };
      
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);
      expect(result).toEqual(user);
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalledWith(user);
    });
  });
});
```

### 测试 Controller

```typescript
// user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: 1, username: 'test' }];
      mockUserService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();
      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: 1, username: 'test' };
      mockUserService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('1');
      expect(result).toEqual(user);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});
```

---

## E2E 测试

### 测试文件结构

```typescript
// test/user.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/user (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/user')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/user (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/user')
      .send({
        username: 'test',
        email: 'test@example.com',
        password: '123456',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe('test');
      });
  });

  it('/user/:id (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/user/1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
});
```

---

## 测试工具

### Jest 配置

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（自动运行）
npm run test:watch

# 生成覆盖率报告
npm run test:cov

# 运行 E2E 测试
npm run test:e2e
```

---

## 测试最佳实践

### 1. 测试命名

```typescript
describe('UserService', () => {
  describe('findOne', () => {
    it('should return a user when user exists', () => {});
    it('should throw NotFoundException when user not found', () => {});
  });
});
```

### 2. AAA 模式

```typescript
it('should create a user', async () => {
  // Arrange - 准备
  const createUserDto = { username: 'test', email: 'test@example.com', password: '123456' };
  const expectedUser = { id: 1, ...createUserDto };

  // Act - 执行
  const result = await service.create(createUserDto);

  // Assert - 断言
  expect(result).toEqual(expectedUser);
});
```

### 3. Mock 数据

```typescript
const mockUsers = [
  { id: 1, username: 'user1', email: 'user1@example.com' },
  { id: 2, username: 'user2', email: 'user2@example.com' },
];
```

### 4. 清理 Mock

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

---

## 下一步学习

- **10_mysql_basics.md** - MySQL 数据库基础
- **11_typeorm_intro.md** - TypeORM 入门与配置

---

## 练习任务

1. 为 UserService 编写单元测试
2. 为 UserController 编写单元测试
3. 编写 E2E 测试覆盖所有 API
4. 生成测试覆盖率报告

