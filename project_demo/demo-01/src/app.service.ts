import { Injectable } from '@nestjs/common';

/**
 * AppService - 根服务
 * 只保留基础方法
 * User 相关业务已迁移到 /user/user.service.ts
 */
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello NestJS! 🚀';
  }
}
