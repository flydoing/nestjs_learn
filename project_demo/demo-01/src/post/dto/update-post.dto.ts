import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

/**
 * UpdatePostDto - 更新文章的数据传输对象
 *
 * 继承 CreatePostDto，所有字段变为可选
 * 实际业务场景：更新时只需传入要修改的字段
 */
export class UpdatePostDto extends PartialType(CreatePostDto) {
  // 所有字段都是可选的
  // title?: string;
  // content?: string;
  // summary?: string;
  // categoryId?: number;
  // tags?: string;
  // status?: number;
  // coverImage?: string;
  // isTop?: boolean;
}
