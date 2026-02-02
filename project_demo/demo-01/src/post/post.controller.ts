import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostDto } from './dto/query-post.dto';
import { PostResponseDto, PostPageResponseDto } from './dto/post-response.dto';

/**
 * PostController - 文章控制器
 *
 * 使用 DTO 进行请求验证和响应序列化
 */
@Controller('post')
@UseInterceptors(ClassSerializerInterceptor) // 启用响应序列化
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * 创建文章
   *
   * @route   POST /api/v1/post
   * @url     http://localhost:3000/api/v1/post
   * @headers Content-Type: application/json
   * @body    {
   *            "title": "NestJS 入门教程",
   *            "content": "这是一篇关于 NestJS 的详细教程...",
   *            "summary": "本文介绍 NestJS 框架的核心概念",
   *            "authorId": 1,
   *            "categoryId": 1,
   *            "tags": "NestJS,TypeScript,后端开发",
   *            "status": 1,
   *            "coverImage": "https://example.com/cover.jpg",
   *            "isTop": false
   *          }
   */
  @Post()
  create(@Body() createPostDto: CreatePostDto): PostResponseDto {
    const post = this.postService.create(createPostDto);
    return new PostResponseDto(post);
  }

  /**
   * 分页查询文章列表
   *
   * @route   GET /api/v1/post
   * @url     http://localhost:3000/api/v1/post?page=1&pageSize=10&keyword=NestJS&categoryId=1&status=1&sortBy=createdAt&sortOrder=DESC
   * @query   page - 页码（默认1）
   * @query   pageSize - 每页数量（默认10，最大100）
   * @query   keyword - 标题关键词搜索
   * @query   categoryId - 分类ID筛选
   * @query   authorId - 作者ID筛选
   * @query   status - 状态筛选（0-草稿 1-已发布 2-已下架）
   * @query   sortBy - 排序字段（createdAt/updatedAt/viewCount/likeCount）
   * @query   sortOrder - 排序方向（ASC/DESC）
   * @query   isTop - 是否置顶
   */
  @Get()
  findAll(@Query() queryDto: QueryPostDto): PostPageResponseDto {
    return this.postService.findAll(queryDto);
  }

  /**
   * 获取单个文章详情（返回完整内容）
   *
   * @route   GET /api/v1/post/:id
   * @url     http://localhost:3000/api/v1/post/1
   * @param   id - 文章ID（路径参数）
   * @note    会自动增加浏览量
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): PostResponseDto {
    const post = this.postService.findOne(id);
    return new PostResponseDto(post);
  }

  /**
   * 更新文章（部分更新）
   *
   * @route   PATCH /api/v1/post/:id
   * @url     http://localhost:3000/api/v1/post/1
   * @param   id - 文章ID（路径参数）
   * @headers Content-Type: application/json
   * @body    {
   *            "title": "更新后的标题",
   *            "status": 1
   *          }
   * @note    只需传入要修改的字段
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
  ): PostResponseDto {
    const post = this.postService.update(id, updatePostDto);
    return new PostResponseDto(post);
  }

  /**
   * 删除文章（软删除，改为下架状态）
   *
   * @route   DELETE /api/v1/post/:id
   * @url     http://localhost:3000/api/v1/post/1
   * @param   id - 文章ID（路径参数）
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): { message: string } {
    this.postService.remove(id);
    return { message: '文章已删除' };
  }
}
