/**
 * Post Entity - 文章实体
 *
 * 实际业务场景中的文章实体，包含完整的文章信息
 * 注意：响应序列化在 PostResponseDto 中处理
 */
export class Post {
  /**
   * 文章 ID
   */
  id: number;

  /**
   * 文章标题
   */
  title: string;

  /**
   * 文章内容
   */
  content: string;

  /**
   * 文章摘要
   */
  summary: string;

  /**
   * 作者 ID
   */
  authorId: number;

  /**
   * 分类 ID
   */
  categoryId: number;

  /**
   * 标签（多个，用逗号分隔）
   */
  tags: string;

  /**
   * 文章状态：0-草稿 1-已发布 2-已下架
   */
  status: number;

  /**
   * 浏览量
   */
  viewCount: number;

  /**
   * 点赞数
   */
  likeCount: number;

  /**
   * 封面图片 URL
   */
  coverImage: string;

  /**
   * 是否置顶
   */
  isTop: boolean;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;

  /**
   * 发布时间（发布时设置）
   */
  publishedAt: Date;

  /**
   * 构造函数
   */
  constructor(partial: Partial<Post>) {
    Object.assign(this, partial);
  }
}
