import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
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
