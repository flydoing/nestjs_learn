import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * AppController - 根控制器
 * 只保留基础的健康检查接口
 * User 相关接口已迁移到 /user/user.controller.ts
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET / - 健康检查 / 欢迎页
  @Get()
  getHello(): string {
    return this.appService.getHello();
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
