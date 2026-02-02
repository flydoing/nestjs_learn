import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 排序字段枚举
 */
export enum PostSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  VIEW_COUNT = 'viewCount',
  LIKE_COUNT = 'likeCount',
}

/**
 * 排序方向枚举
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * QueryPostDto - 文章分页查询的数据传输对象
 *
 * 实际业务场景：支持按标题搜索、分类筛选、状态筛选、排序、分页
 */
export class QueryPostDto {
  /**
   * 页码（默认1）
   * @example 1
   */
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  @IsOptional()
  page?: number = 1;

  /**
   * 每页数量（默认10，最大100）
   * @example 10
   */
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  @IsOptional()
  pageSize?: number = 10;

  /**
   * 标题关键词搜索（可选）
   * @example "NestJS"
   */
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  keyword?: string;

  /**
   * 分类 ID 筛选（可选）
   * @example 1
   */
  @Type(() => Number)
  @IsInt({ message: '分类ID必须是整数' })
  @IsOptional()
  categoryId?: number;

  /**
   * 作者 ID 筛选（可选）
   * @example 1
   */
  @Type(() => Number)
  @IsInt({ message: '作者ID必须是整数' })
  @IsOptional()
  authorId?: number;

  /**
   * 状态筛选（可选）
   * 0-草稿 1-已发布 2-已下架
   * @example 1
   */
  @Type(() => Number)
  @IsInt({ message: '状态必须是整数' })
  @Min(0, { message: '状态不能小于0' })
  @Max(2, { message: '状态不能大于2' })
  @IsOptional()
  status?: number;

  /**
   * 排序字段（可选，默认按创建时间）
   * @example "createdAt"
   */
  @IsEnum(PostSortField, { message: '排序字段必须是有效的枚举值' })
  @IsOptional()
  sortBy?: PostSortField = PostSortField.CREATED_AT;

  /**
   * 排序方向（可选，默认降序）
   * @example "DESC"
   */
  @IsEnum(SortOrder, { message: '排序方向必须是 ASC 或 DESC' })
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * 是否只查询置顶文章（可选）
   * @example false
   */
  @Type(() => Boolean)
  @IsBoolean({ message: '是否置顶必须是布尔值' })
  @IsOptional()
  isTop?: boolean;
}

