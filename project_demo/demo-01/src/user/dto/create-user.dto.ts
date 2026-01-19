import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * CreateUserDto - 创建用户的数据传输对象
 *
 * 验证顺序说明：
 * - 装饰器从下往上执行
 * - 先检查 @IsNotEmpty（字段是否存在）
 * - 再检查类型和格式
 *
 * 使用前需安装：npm install class-validator class-transformer
 */
export class CreateUserDto {
  /**
   * 用户名（必填）
   * @example "zhangsan"
   */
  @MaxLength(20, { message: '用户名最多20个字符' })
  @MinLength(2, { message: '用户名至少2个字符' })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  /**
   * 邮箱（必填）
   * @example "zhangsan@example.com"
   */
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  /**
   * 密码（必填）
   * @example "password123"
   */
  @MaxLength(50, { message: '密码最多50个字符' })
  @MinLength(6, { message: '密码至少6个字符' })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  /**
   * 年龄（可选）
   * @example 25
   */
  @Max(150, { message: '年龄不能大于150' })
  @Min(0, { message: '年龄不能小于0' })
  @IsInt({ message: '年龄必须是整数' })
  @IsOptional()
  age?: number;

  /**
   * 头像 URL（可选）
   * @example "https://example.com/avatar.jpg"
   */
  @IsString({ message: '头像必须是字符串' })
  @IsOptional()
  avatar?: string;
}
