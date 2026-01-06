# Redis 基础

> 面向前端开发者的 Redis 入门指南

## 什么是 Redis？

Redis（Remote Dictionary Server）是一个开源的**内存数据结构存储**系统。与 MySQL 不同，Redis 将数据存储在内存中，因此读写速度极快（微秒级别）。

### Redis 的主要用途

| 用途 | 说明 | 示例 |
|------|------|------|
| 缓存 | 缓存数据库查询结果 | 热门文章列表 |
| 会话存储 | 存储用户登录状态 | Session/Token |
| 消息队列 | 异步任务处理 | 邮件发送队列 |
| 排行榜 | 实时排名计算 | 游戏积分榜 |
| 计数器 | 统计数量 | 点赞数、浏览量 |
| 分布式锁 | 防止并发问题 | 秒杀库存扣减 |
| 实时数据 | 地理位置、消息推送 | 附近的人 |

### Redis vs MySQL

| 特性 | Redis | MySQL |
|------|-------|-------|
| 存储位置 | 内存 | 磁盘 |
| 读写速度 | 极快（10万+ QPS） | 较快（数千 QPS） |
| 数据持久化 | 可选（RDB/AOF） | 默认持久化 |
| 数据结构 | 丰富（String/Hash/List等） | 表格 |
| 适用场景 | 缓存、计数、队列 | 持久化存储 |

---

## 环境安装

### 方式一：Docker 安装（推荐）

```bash
# 拉取 Redis 镜像
docker pull redis:7

# 启动 Redis 容器
docker run --name redis7 \
  -p 6379:6379 \
  -d redis:7 redis-server --appendonly yes

# 查看容器状态
docker ps

# 进入 Redis 命令行
docker exec -it redis7 redis-cli
```

### 方式二：本地安装

- **macOS**: `brew install redis`
- **Windows**: 下载 [Redis for Windows](https://github.com/tporadowski/redis/releases)
- **Linux**: `sudo apt install redis-server`

### 图形化工具推荐

- **Another Redis Desktop Manager**（免费、跨平台）
- **Redis Insight**（官方工具）
- **VSCode 插件**: Database Client

---

## 数据类型

### 1. String（字符串）

最基础的数据类型，可以存储字符串、数字、JSON 等。

```bash
# 设置值
SET name "张三"

# 获取值
GET name

# 设置过期时间（秒）
SET token "abc123" EX 3600  # 1小时后过期
SETEX token 3600 "abc123"   # 同上

# 设置过期时间（毫秒）
SET token "abc123" PX 60000

# 只在 key 不存在时设置（分布式锁常用）
SETNX lock:order:123 "locked"

# 数字操作
SET count 0
INCR count       # +1，返回 1
INCRBY count 10  # +10，返回 11
DECR count       # -1，返回 10
DECRBY count 5   # -5，返回 5

# 查看剩余过期时间
TTL token   # 返回秒数，-1表示永不过期，-2表示已过期
PTTL token  # 返回毫秒数

# 删除 key
DEL name
```

### 2. Hash（哈希表）

适合存储对象，类似于 JavaScript 的 Object。

```bash
# 设置单个字段
HSET user:1 name "张三"
HSET user:1 age 25
HSET user:1 email "zhangsan@example.com"

# 一次设置多个字段
HMSET user:2 name "李四" age 30 email "lisi@example.com"

# 获取单个字段
HGET user:1 name

# 获取多个字段
HMGET user:1 name age

# 获取所有字段和值
HGETALL user:1

# 判断字段是否存在
HEXISTS user:1 name

# 删除字段
HDEL user:1 age

# 数字字段操作
HINCRBY user:1 age 1
```

### 3. List（列表）

有序的字符串列表，适合消息队列、最新列表等。

```bash
# 从左边插入
LPUSH messages "消息1"
LPUSH messages "消息2"

# 从右边插入
RPUSH messages "消息3"

# 获取列表（0 到 -1 表示全部）
LRANGE messages 0 -1

# 获取指定范围
LRANGE messages 0 9  # 前10条

# 获取列表长度
LLEN messages

# 从左边弹出
LPOP messages

# 从右边弹出
RPOP messages

# 阻塞弹出（用于消息队列）
BLPOP messages 30  # 等待30秒
```

### 4. Set（集合）

无序、不重复的字符串集合，适合标签、关注列表等。

```bash
# 添加成员
SADD tags "JavaScript" "TypeScript" "Node.js"

# 获取所有成员
SMEMBERS tags

# 判断是否是成员
SISMEMBER tags "JavaScript"

# 获取成员数量
SCARD tags

# 删除成员
SREM tags "Node.js"

# 集合运算
SADD user:1:follow 100 101 102
SADD user:2:follow 101 102 103

SINTER user:1:follow user:2:follow   # 交集（共同关注）
SUNION user:1:follow user:2:follow   # 并集
SDIFF user:1:follow user:2:follow    # 差集（1关注但2没关注的）
```

### 5. Sorted Set（有序集合）

带分数的有序集合，适合排行榜。

```bash
# 添加成员（score member）
ZADD leaderboard 100 "player1"
ZADD leaderboard 200 "player2"
ZADD leaderboard 150 "player3"

# 获取排名（从低到高）
ZRANGE leaderboard 0 -1
ZRANGE leaderboard 0 -1 WITHSCORES

# 获取排名（从高到低）
ZREVRANGE leaderboard 0 -1 WITHSCORES

# 获取指定成员的排名
ZRANK leaderboard "player2"      # 从低到高的排名
ZREVRANK leaderboard "player2"   # 从高到低的排名

# 获取指定成员的分数
ZSCORE leaderboard "player2"

# 增加分数
ZINCRBY leaderboard 50 "player1"

# 按分数范围获取
ZRANGEBYSCORE leaderboard 100 200

# 获取成员数量
ZCARD leaderboard
```

---

## 常用命令

### 键操作

```bash
# 查找键
KEYS *           # 所有键（生产环境慎用）
KEYS user:*      # 匹配模式
SCAN 0 MATCH user:* COUNT 100  # 推荐：游标分页查找

# 检查键是否存在
EXISTS name

# 查看键类型
TYPE name

# 设置过期时间
EXPIRE name 3600    # 秒
PEXPIRE name 60000  # 毫秒

# 移除过期时间
PERSIST name

# 重命名
RENAME oldkey newkey
```

### 服务器命令

```bash
# 查看服务器信息
INFO

# 查看内存使用
INFO memory

# 查看连接客户端
CLIENT LIST

# 清空当前数据库
FLUSHDB

# 清空所有数据库
FLUSHALL
```

---

## 在 NestJS 中使用 Redis

### 安装依赖

```bash
npm install @nestjs-modules/ioredis ioredis
# 或者
npm install cache-manager cache-manager-redis-store
```

### 方式一：使用 ioredis

```typescript
// redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';

@Global()
@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
  ],
  exports: [RedisModule],
})
export class AppRedisModule {}
```

```typescript
// cache.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  // 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  // 删除缓存
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // 检查是否存在
  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
}
```

### 方式二：使用 NestJS 内置缓存

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 600, // 默认过期时间（秒）
    }),
  ],
})
export class AppModule {}
```

```typescript
// user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findOne(id: number) {
    // 先从缓存获取
    const cacheKey = `user:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 缓存未命中，从数据库获取
    const user = await this.userRepository.findOne(id);
    
    // 存入缓存
    await this.cacheManager.set(cacheKey, user, 3600);
    
    return user;
  }
}
```

---

## 常见缓存策略

### 1. Cache-Aside（旁路缓存）

最常用的策略：读时先查缓存，未命中再查数据库并更新缓存。

```typescript
async getUser(id: number) {
  // 1. 先查缓存
  let user = await this.cache.get(`user:${id}`);
  
  // 2. 缓存未命中，查数据库
  if (!user) {
    user = await this.db.findUser(id);
    // 3. 写入缓存
    await this.cache.set(`user:${id}`, user, 3600);
  }
  
  return user;
}

// 更新时删除缓存
async updateUser(id: number, data: any) {
  await this.db.updateUser(id, data);
  await this.cache.del(`user:${id}`);
}
```

### 2. 缓存预热

在系统启动时预先加载热点数据到缓存。

```typescript
@Injectable()
export class CacheWarmupService implements OnModuleInit {
  async onModuleInit() {
    // 预热热门数据
    const hotPosts = await this.postService.findHotPosts();
    for (const post of hotPosts) {
      await this.cache.set(`post:${post.id}`, post);
    }
  }
}
```

### 3. 防止缓存穿透

当查询一个不存在的数据时，也要缓存空值。

```typescript
async getUser(id: number) {
  const cacheKey = `user:${id}`;
  const cached = await this.cache.get(cacheKey);
  
  if (cached !== undefined) {
    return cached; // 包括 null
  }
  
  const user = await this.db.findUser(id);
  
  // 即使是 null 也要缓存，但时间短一些
  await this.cache.set(cacheKey, user, user ? 3600 : 60);
  
  return user;
}
```

---

## 实际应用示例

### 会话存储

```typescript
@Injectable()
export class SessionService {
  constructor(@InjectRedis() private redis: Redis) {}

  async createSession(userId: number): Promise<string> {
    const sessionId = crypto.randomUUID();
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify({ userId, createdAt: Date.now() }),
      'EX',
      86400 // 24小时
    );
    return sessionId;
  }

  async getSession(sessionId: string) {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async destroySession(sessionId: string) {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

### 接口限流

```typescript
@Injectable()
export class RateLimiterService {
  constructor(@InjectRedis() private redis: Redis) {}

  async isAllowed(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return current <= limit;
  }
}

// 使用示例：每分钟最多100次请求
const allowed = await this.rateLimiter.isAllowed(
  `ratelimit:${ip}`,
  100,  // 限制次数
  60    // 时间窗口（秒）
);
```

---

## 下一步学习

- **21_redis_nestjs.md** - NestJS 中 Redis 的深入使用
- **22_redis_cache.md** - 缓存策略与最佳实践

---

## 练习任务

1. 使用 Docker 启动 Redis
2. 使用 redis-cli 练习各种数据类型操作
3. 在 NestJS 中集成 Redis
4. 实现一个简单的缓存服务
5. 实现用户会话管理功能

