import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto - 更新用户的数据传输对象
 *
 * PartialType 的作用：
 * 1. 继承 CreateUserDto 的所有属性
 * 2. 将所有属性变为可选（Partial）
 * 3. 保留原有的验证规则
 *
 * 这样更新用户时可以只传需要修改的字段
 *
 * @example
 * // 只更新用户名
 * { username: "newname" }
 *
 * // 只更新邮箱和年龄
 * { email: "new@example.com", age: 30 }
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // 继承 CreateUserDto 的所有字段，但都变为可选
  // username?: string;
  // email?: string;
  // password?: string;
  // age?: number;
  // avatar?: string;
}
