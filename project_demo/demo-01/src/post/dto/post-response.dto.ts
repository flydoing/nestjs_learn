import { Exclude, Expose } from 'class-transformer';

/**
 * PostResponseDto - 文章响应数据传输对象
 *
 * 用于控制返回给前端的数据，隐藏敏感字段
 */
export class PostResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  summary: string;

  @Expose()
  content: string;

  @Expose()
  authorId: number;

  @Expose()
  categoryId: number;

  @Expose()
  tags: string;

  @Expose()
  status: number;

  @Expose()
  viewCount: number;

  @Expose()
  likeCount: number;

  @Expose()
  coverImage: string;

  @Expose()
  isTop: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  publishedAt: Date;

  /**
   * 构造函数
   */
  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * PostListResponseDto - 文章列表响应（简化版，不返回完整内容）
 */
export class PostListResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  summary: string;

  @Expose()
  authorId: number;

  @Expose()
  categoryId: number;

  @Expose()
  tags: string;

  @Expose()
  status: number;

  @Expose()
  viewCount: number;

  @Expose()
  likeCount: number;

  @Expose()
  coverImage: string;

  @Expose()
  isTop: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  publishedAt: Date;

  // 不返回 content（内容太长）
  @Exclude()
  content: string;

  // 不返回 updatedAt
  @Exclude()
  updatedAt: Date;

  constructor(partial: Partial<PostListResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * PostPageResponseDto - 分页响应数据结构
 */
export class PostPageResponseDto {
  @Expose()
  list: PostListResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  pageSize: number;

  @Expose()
  totalPages: number;

  constructor(
    list: PostListResponseDto[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    this.list = list;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
  }
}

