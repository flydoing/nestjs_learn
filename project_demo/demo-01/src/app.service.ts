import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!-11';
  }

  getUsers(): string {
    return 'Hello Users!-11';
  }
  getUser(id: string): string {
    return `Hello User!-11 ${id}`;
  }
  createUser(user: any): string {
    return `Hello User!-11 ${user.name}`;
  }
  updateUser(id: string, user: any): string {
    return `Hello User!-11 ${id} ${user.id}`;
  }
  deleteUser(id: string): string {
    return `Hello User!-11 ${id}`;
  }
}
