import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


  /**
   * 架构图：
用户请求 → Controller（路由层）→ Service（业务层）→ 返回响应
              ↑                      ↑
              └─── Module（组织连接）──┘
                      ↑
                   imports（引入其他模块的能力）

                   
   */
  /**
   * imports - 导入其他模块
   * 
   * 作用：引入其他功能模块，使其导出的 providers 在当前模块可用
   * 
   * 企业应用场景：
   * - 数据库模块：TypeOrmModule.forRoot() 连接 MySQL/PostgreSQL
   * - 配置模块：ConfigModule.forRoot() 读取环境变量
   * - 缓存模块：CacheModule.register() 集成 Redis 缓存
   * - 认证模块：AuthModule 处理 JWT 登录认证
   * - 业务模块：UserModule、OrderModule、ProductModule 等
   * 
   * 示例：imports: [UserModule, OrderModule, TypeOrmModule.forRoot()]
   */

  /**
   * controllers - 控制器列表
   * 
   * 作用：处理 HTTP 请求路由，接收请求参数，返回响应数据
   *       类似于前端 Vue Router 的路由处理器
   * 
   * 企业应用场景：
   * - UserController：处理 /users 相关的增删改查接口
   * - OrderController：处理订单创建、支付、查询接口
   * - AuthController：处理登录、注册、刷新 Token 接口
   * - UploadController：处理文件上传接口
   * 
   * 示例：controllers: [UserController, OrderController, AuthController]
   */

  /**
   * providers - 服务提供者列表
   * 
   * 作用：处理业务逻辑，可被注入到 Controller 或其他 Service 中
   *       类似于前端 Vuex/Pinia 的 actions，负责核心业务处理
   * 
   * 企业应用场景：
   * - UserService：用户注册、密码加密、权限校验
   * - OrderService：订单计算、库存扣减、支付对接
   * - EmailService：发送验证码、通知邮件
   * - LoggerService：日志记录、错误追踪
   * - 第三方服务：微信支付、阿里云 OSS、短信服务
   * 
   * 示例：providers: [UserService, OrderService, EmailService]
   */

/**
app.module.ts - 根模块（企业级配置）

import { Module, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot(), // 环境变量
    CacheModule.register(), // 缓存
    ScheduleModule.forRoot(), // 定时任务
    ThrottlerModule.forRoot({ // 限流
      ttl: 60,
      limit: 100,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'CONNECTION', // 自定义Provider
      useFactory: () => new DatabaseConnection(),
    },
  ],
  exports: [AppService], // 暴露服务给其他模块
})
export class AppModule {}

*/