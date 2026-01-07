import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/v1/users') // 是一个装饰器（Decorator），用于将一个类标记为 NestJS 的控制器。
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // getHello(): string {
  //   return this.appService.getHello();
  // }

  /**
   * RESTful API 设计规范：
   * - URL 表示资源（名词），HTTP 方法表示动作（动词）
   * - GET    = 查询（Read）
   * - POST   = 创建（Create）
   * - PUT    = 全量更新（Update）
   * - PATCH  = 部分更新（Partial Update）
   * - DELETE = 删除（Delete）
   */

  // GET /api/v1/users - 获取用户列表
  @Get()
  findAll(): string {
    return this.appService.getUsers();
  }

  // GET /api/v1/users/:id - 获取单个用户
  @Get(':id')
  findOne(@Param('id') id: string): string {
    return this.appService.getUser(id);
  }

  // POST /api/v1/users - 创建用户
  @Post()
  create(@Body() user: any): string {
    return this.appService.createUser(user);
  }

  // PUT /api/v1/users/:id - 更新用户
  @Put(':id')
  update(@Param('id') id: string, @Body() user: any): string {
    return this.appService.updateUser(id, user);
  }

  // DELETE /api/v1/users/:id - 删除用户
  @Delete(':id')
  remove(@Param('id') id: string): string {
    return this.appService.deleteUser(id);
  }
}

// app.controller.ts - 路由控制器（RESTful增强）

/**

import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  Headers,
  HttpCode,
  Header,
} from '@nestjs/common';

@Controller('api') // 基础路径
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello/:name')
  @HttpCode(200)
  @Header('Cache-Control', 'none')
  getHello(
    @Param('name') name: string,
    @Query('debug') debug: boolean,
    @Headers('authorization') auth: string
  ): string {
    return this.appService.getCustomHello(name);
  }

  @Post('messages')
  createMessage(@Body() messageDto: MessageDto) {
    return this.appService.create(messageDto);
  }
}


*/
