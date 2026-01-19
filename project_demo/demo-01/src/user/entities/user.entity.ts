import { Exclude } from 'class-transformer';

/**
 * User Entity - 用户实体
 *
 * Entity 的作用：
 * 1. 定义数据库表结构（配合 TypeORM）
 * 2. 定义数据模型的属性和类型
 * 3. 配合 class-transformer 控制响应输出
 *
 * 注意：当前是纯 Class 示例，后续集成 TypeORM 时
 * 需要添加 @Entity()、@Column() 等装饰器
 */
export class User {
  /**
   * 用户 ID
   * 数据库中通常是自增主键
   */
  id: number;

  /**
   * 用户名
   */
  username: string;

  /**
   * 邮箱
   */
  email: string;

  /**
   * 密码
   * @Exclude() 表示在响应时排除此字段，防止密码泄露
   */
  @Exclude()
  password: string;

  /**
   * 年龄
   */
  age?: number;

  /**
   * 头像 URL
   */
  avatar?: string;

  /**
   * 用户状态：1-正常 0-禁用
   */
  status: number;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;

  /**
   * 构造函数 - 支持 Partial 初始化
   * @example new User({ username: 'test', email: 'test@example.com' })
   */
  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

/**
 * 后续集成 TypeORM 后的完整示例：
 *
 * import {
 *   Entity,
 *   Column,
 *   PrimaryGeneratedColumn,
 *   CreateDateColumn,
 *   UpdateDateColumn,
 * } from 'typeorm';
 *
 * @Entity('users')
 * export class User {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 *
 *   @Column({ length: 50, unique: true })
 *   username: string;
 *
 *   @Column({ length: 100, unique: true })
 *   email: string;
 *
 *   @Column({ length: 255 })
 *   @Exclude()
 *   password: string;
 *
 *   @Column({ nullable: true })
 *   age: number;
 *
 *   @Column({ nullable: true })
 *   avatar: string;
 *
 *   @Column({ default: 1 })
 *   status: number;
 *
 *   @CreateDateColumn()
 *   createdAt: Date;
 *
 *   @UpdateDateColumn()
 *   updatedAt: Date;
 * }
 */
