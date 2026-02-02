import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { Post } from './entities/post.entity';
import { PostPageResponseDto, PostListResponseDto } from './dto/post-response.dto';

/**
 * PostService - 文章服务
 *
 * 实际业务场景：模拟数据库操作，实现分页查询、CRUD 等功能
 */
@Injectable()
export class PostService {
  // 模拟数据库存储
  private posts: Post[] = [];
  private idCounter = 1;

  /**
   * 创建文章
   */
  create(createPostDto: CreatePostDto): Post {
    const post: Post = {
      id: this.idCounter++,
      title: createPostDto.title,
      content: createPostDto.content,
      summary: createPostDto.summary || createPostDto.content.substring(0, 200),
      authorId: createPostDto.authorId,
      categoryId: createPostDto.categoryId,
      tags: createPostDto.tags || '',
      status: createPostDto.status ?? 0, // 默认草稿
      viewCount: 0,
      likeCount: 0,
      coverImage: createPostDto.coverImage || '',
      isTop: createPostDto.isTop ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: createPostDto.status === 1 ? new Date() : null,
    };

    this.posts.push(post);
    return post;
  }

  /**
   * 分页查询文章列表
   *
   * 实际业务场景：支持多条件筛选、排序、分页
   */
  findAll(queryDto: QueryPostDto): PostPageResponseDto {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      categoryId,
      authorId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      isTop,
    } = queryDto;

    // 1. 筛选数据
    let filteredPosts = [...this.posts];

    // 按关键词搜索（标题）
    if (keyword) {
      filteredPosts = filteredPosts.filter((post) =>
        post.title.includes(keyword),
      );
    }

    // 按分类筛选
    if (categoryId !== undefined) {
      filteredPosts = filteredPosts.filter(
        (post) => post.categoryId === categoryId,
      );
    }

    // 按作者筛选
    if (authorId !== undefined) {
      filteredPosts = filteredPosts.filter(
        (post) => post.authorId === authorId,
      );
    }

    // 按状态筛选
    if (status !== undefined) {
      filteredPosts = filteredPosts.filter((post) => post.status === status);
    }

    // 按置顶筛选
    if (isTop !== undefined) {
      filteredPosts = filteredPosts.filter((post) => post.isTop === isTop);
    }

    // 2. 排序
    filteredPosts.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // 3. 分页
    const total = filteredPosts.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedPosts = filteredPosts.slice(start, end);

    // 4. 转换为响应 DTO（列表不返回完整内容）
    const list: PostListResponseDto[] = paginatedPosts.map(
      (post) => new PostListResponseDto(post),
    );

    return new PostPageResponseDto(list, total, page, pageSize);
  }

  /**
   * 查询单个文章（返回完整内容）
   */
  findOne(id: number): Post {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundException(`文章 #${id} 不存在`);
    }

    // 增加浏览量
    post.viewCount++;

    return post;
  }

  /**
   * 更新文章
   */
  update(id: number, updatePostDto: UpdatePostDto): Post {
    const post = this.findOne(id); // 如果不存在会抛出异常

    // 更新字段
    Object.assign(post, updatePostDto);
    post.updatedAt = new Date();

    // 如果状态改为已发布，设置发布时间
    if (updatePostDto.status === 1 && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    return post;
  }

  /**
   * 删除文章（软删除，改为下架状态）
   */
  remove(id: number): void {
    const post = this.findOne(id);
    post.status = 2; // 改为已下架
    post.updatedAt = new Date();
  }
}
