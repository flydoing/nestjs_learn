# MySQL 数据库基础

> 面向前端开发者的 MySQL 入门指南

## 什么是 MySQL？

MySQL 是世界上最流行的开源关系型数据库管理系统（RDBMS）。与 MongoDB 不同，MySQL 使用表格形式存储数据，数据之间通过关系（外键）连接。

### 关系型 vs 非关系型数据库

| 特性 | MySQL（关系型） | MongoDB（非关系型） |
|------|----------------|-------------------|
| 数据模型 | 表格（行和列） | 文档（JSON-like） |
| 模式 | 固定结构（Schema） | 灵活结构 |
| 关系 | 外键约束 | 嵌入/引用 |
| 事务 | ACID 完整支持 | 有限支持 |
| 查询 | SQL | MongoDB Query |
| 适用场景 | 结构化数据、金融系统 | 灵活数据、快速迭代 |

---

## 环境安装

### 方式一：Docker 安装（推荐）

```bash
# 拉取 MySQL 镜像
docker pull mysql:8.0

# 启动 MySQL 容器
docker run --name mysql8 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=nestjs_demo \
  -p 3306:3306 \
  -d mysql:8.0

# 查看容器状态
docker ps

# 进入 MySQL 命令行
docker exec -it mysql8 mysql -uroot -p123456
```

### 方式二：本地安装

- **macOS**: `brew install mysql`
- **Windows**: 下载 [MySQL Installer](https://dev.mysql.com/downloads/installer/)
- **Linux**: `sudo apt install mysql-server`

### 图形化工具推荐

- **DBeaver**：免费、跨平台、功能强大
- **Navicat**：商业软件、界面友好
- **MySQL Workbench**：官方工具
- **VSCode 插件**：Database Client

---

## SQL 基础语法

### 数据库操作

```sql
-- 创建数据库
CREATE DATABASE nestjs_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 查看所有数据库
SHOW DATABASES;

-- 选择数据库
USE nestjs_demo;

-- 删除数据库（谨慎！）
DROP DATABASE database_name;
```

### 表操作

```sql
-- 创建用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  status TINYINT DEFAULT 1 COMMENT '1:正常 0:禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 查看表结构
DESC users;
SHOW CREATE TABLE users;

-- 修改表结构
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users MODIFY COLUMN phone VARCHAR(15);
ALTER TABLE users DROP COLUMN phone;

-- 删除表
DROP TABLE users;
```

---

## CRUD 操作

### 插入数据（Create）

```sql
-- 插入单条数据
INSERT INTO users (username, email, password)
VALUES ('张三', 'zhangsan@example.com', 'password123');

-- 插入多条数据
INSERT INTO users (username, email, password) VALUES
  ('李四', 'lisi@example.com', 'password456'),
  ('王五', 'wangwu@example.com', 'password789');
```

### 查询数据（Read）

```sql
-- 查询所有数据
SELECT * FROM users;

-- 查询指定字段
SELECT id, username, email FROM users;

-- 条件查询
SELECT * FROM users WHERE status = 1;
SELECT * FROM users WHERE username LIKE '%张%';
SELECT * FROM users WHERE id IN (1, 2, 3);
SELECT * FROM users WHERE created_at >= '2024-01-01';

-- 排序
SELECT * FROM users ORDER BY created_at DESC;

-- 分页（LIMIT offset, count）
SELECT * FROM users LIMIT 0, 10;  -- 第1页，每页10条
SELECT * FROM users LIMIT 10, 10; -- 第2页，每页10条

-- 聚合函数
SELECT COUNT(*) FROM users;
SELECT COUNT(*) as total, status FROM users GROUP BY status;
```

### 更新数据（Update）

```sql
-- 更新单条数据
UPDATE users SET email = 'newemail@example.com' WHERE id = 1;

-- 更新多个字段
UPDATE users 
SET username = '新名字', status = 0 
WHERE id = 1;

-- 批量更新
UPDATE users SET status = 0 WHERE created_at < '2023-01-01';
```

### 删除数据（Delete）

```sql
-- 删除指定数据
DELETE FROM users WHERE id = 1;

-- 清空表（保留表结构）
TRUNCATE TABLE users;

-- 软删除（推荐）
-- 通常不真正删除数据，而是标记为已删除
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
UPDATE users SET deleted_at = NOW() WHERE id = 1;
```

---

## 表关系

### 一对多关系

```sql
-- 文章表（一个用户可以有多篇文章）
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 联表查询
SELECT 
  p.id, p.title, p.content,
  u.username as author
FROM posts p
LEFT JOIN users u ON p.user_id = u.id;
```

### 多对多关系

```sql
-- 标签表
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 文章-标签关联表
CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 查询文章的所有标签
SELECT t.name
FROM tags t
INNER JOIN post_tags pt ON t.id = pt.tag_id
WHERE pt.post_id = 1;
```

---

## 索引

索引用于加速查询，类似于书籍的目录。

```sql
-- 创建普通索引
CREATE INDEX idx_email ON users(email);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_username ON users(username);

-- 创建组合索引
CREATE INDEX idx_status_created ON users(status, created_at);

-- 查看表的索引
SHOW INDEX FROM users;

-- 删除索引
DROP INDEX idx_email ON users;
```

### 索引使用原则

1. **经常查询的字段**需要建索引
2. **WHERE、ORDER BY、JOIN** 涉及的字段考虑建索引
3. **数据量小**的表不需要索引
4. **频繁更新**的字段谨慎建索引
5. **避免过多索引**（影响写入性能）

---

## 事务

事务保证一组操作要么全部成功，要么全部失败。

```sql
-- 开启事务
START TRANSACTION;

-- 执行操作
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- 提交事务
COMMIT;

-- 或者回滚事务
ROLLBACK;
```

### ACID 特性

- **A（Atomicity）原子性**：事务中的操作要么全部完成，要么全部不完成
- **C（Consistency）一致性**：事务前后数据的完整性保持一致
- **I（Isolation）隔离性**：多个事务并发执行时互不干扰
- **D（Durability）持久性**：事务完成后，对数据的修改是永久的

---

## 在 NestJS 中使用 MySQL

### 使用 TypeORM

```bash
# 安装依赖
npm install @nestjs/typeorm typeorm mysql2
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'nestjs_demo',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 开发环境使用，自动同步实体到数据库
    }),
  ],
})
export class AppModule {}
```

### 定义实体

```typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ default: 1 })
  status: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 使用 Repository

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 查询所有
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // 根据 ID 查询
  findOne(id: number): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  // 创建用户
  create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  // 更新用户
  async update(id: number, user: Partial<User>): Promise<User> {
    await this.userRepository.update(id, user);
    return this.findOne(id);
  }

  // 删除用户
  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

---

## 下一步学习

- **11_typeorm_intro.md** - TypeORM 深入学习
- **12_typeorm_entity.md** - 实体定义与关系映射
- **13_typeorm_crud.md** - CRUD 操作与查询构建

---

## 练习任务

1. 使用 Docker 启动 MySQL 容器
2. 创建 `nestjs_demo` 数据库
3. 创建 `users` 和 `posts` 表
4. 练习基本的 CRUD SQL 语句
5. 在 NestJS 项目中配置 TypeORM 连接 MySQL

