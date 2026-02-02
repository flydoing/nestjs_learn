import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUrl,
} from 'class-validator';

/**
 * CreatePostDto - 创建文章的数据传输对象
 *
 * 实际业务场景：创建文章时需要验证标题、内容等必填字段
 */
export class CreatePostDto {
  /**
   * 文章标题（必填）
   * @example "NestJS 入门教程"
   */
  @MaxLength(200, { message: '标题最多200个字符' })
  @MinLength(5, { message: '标题至少5个字符' })
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  /**
   * 文章内容（必填）
   * @example "这是一篇关于 NestJS 的教程..."
   */
  @MinLength(50, { message: '内容至少50个字符' })
  @IsString({ message: '内容必须是字符串' })
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  /**
   * 文章摘要（可选，不填则自动截取内容前200字）
   * @example "本文介绍 NestJS 框架的核心概念..."
   */
  @MaxLength(500, { message: '摘要最多500个字符' })
  @IsString({ message: '摘要必须是字符串' })
  @IsOptional()
  summary?: string;

  /**
   * 作者 ID（必填）
   * @example 1
   */
  @IsInt({ message: '作者ID必须是整数' })
  @Min(1, { message: '作者ID必须大于0' })
  @IsNotEmpty({ message: '作者ID不能为空' })
  authorId: number;

  /**
   * 分类 ID（必填）
   * @example 1
   */
  @IsInt({ message: '分类ID必须是整数' })
  @Min(1, { message: '分类ID必须大于0' })
  @IsNotEmpty({ message: '分类ID不能为空' })
  categoryId: number;

  /**
   * 标签（可选，多个用逗号分隔）
   * @example "NestJS,TypeScript,后端开发"
   */
  @MaxLength(200, { message: '标签最多200个字符' })
  @IsString({ message: '标签必须是字符串' })
  @IsOptional()
  tags?: string;

  /**
   * 文章状态（可选，默认0-草稿）
   * 0-草稿 1-已发布 2-已下架
   * @example 0
   */
  @IsInt({ message: '状态必须是整数' })
  @Min(0, { message: '状态不能小于0' })
  @Max(2, { message: '状态不能大于2' })
  @IsOptional()
  status?: number;

  /**
   * 封面图片 URL（可选）
   * @example "https://example.com/cover.jpg"
   */
  @IsUrl({}, { message: '封面图片必须是有效的URL' })
  @IsString({ message: '封面图片必须是字符串' })
  @IsOptional()
  coverImage?: string;

  /**
   * 是否置顶（可选，默认false）
   * @example false
   */
  @IsBoolean({ message: '是否置顶必须是布尔值' })
  @IsOptional()
  isTop?: boolean;
}
