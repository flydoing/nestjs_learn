import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // 记录启动开始时间
  const startTime = Date.now();
  console.log(`\n🚀 [${new Date().toISOString()}] 应用启动中...`);

  const app = await NestFactory.create(AppModule);

  // 设置全局路由前缀 api/v1
  app.setGlobalPrefix('api/v1');

  // 启用全局验证管道
  // 使 DTO 中的 class-validator 装饰器生效
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动过滤 DTO 中未定义的字段
      transform: true, // 自动类型转换（如 string -> number）
      forbidNonWhitelisted: true, // 存在未定义字段时抛出错误
      stopAtFirstError: true, // 每个字段只返回第一个错误
      // 自定义验证错误响应格式
      exceptionFactory: (errors) => {
        // 提取每个字段的错误信息
        const errorDetails = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {})[0],
        }));
        // 拼接所有错误信息为一行
        const messageStr = errorDetails.map((e) => e.message).join('，');
        return new BadRequestException({
          code: 400,
          success: false,
          message: messageStr, // 完整错误信息，如："用户名不能为空，邮箱不能为空，密码至少6个字符"
          errors: errorDetails, // 详细错误列表（可选保留）
          timestamp: new Date().toISOString(),
        });
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // 计算启动耗时
  const duration = Date.now() - startTime;
  console.log(`✅ [${new Date().toISOString()}] 应用启动完成`);
  console.log(`📊 启动耗时: ${duration}ms`);
  console.log(`🌐 服务地址: http://localhost:${port}\n`);
}
bootstrap();

/**
main.ts - 应用入口（增强版）

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // 新增验证管道
import { LoggingInterceptor } from './interceptors/logging.interceptor'; // 自定义拦截器

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局中间件配置
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动过滤非DTO字段
      transform: true, // 自动类型转换
    })
  );
  
  app.useGlobalInterceptors(new LoggingInterceptor()); // 全局日志拦截器
  
  // 跨域配置
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // 端口动态配置
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  });
}
bootstrap();


*/
