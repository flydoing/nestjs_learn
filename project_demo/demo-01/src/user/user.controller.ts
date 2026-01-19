import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 创建用户
   *
   * @route   POST /api/v1/user
   * @url     http://localhost:3000/api/v1/user
   * @headers Content-Type: application/json
   * @body    {
   *            "username": "zhangsan",
   *            "email": "zhangsan@example.com",
   *            "password": "123456",
   *            "age": 25,
   *            "avatar": "https://example.com/avatar.jpg"
   *          }
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * 获取所有用户
   *
   * @route   GET /api/v1/user
   * @url     http://localhost:3000/api/v1/user
   */
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  /**
   * 获取单个用户
   *
   * @route   GET /api/v1/user/:id
   * @url     http://localhost:3000/api/v1/user/1
   * @param   id - 用户ID（路径参数）
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  /**
   * 更新用户（部分更新）
   *
   * @route   PATCH /api/v1/user/:id
   * @url     http://localhost:3000/api/v1/user/1
   * @param   id - 用户ID（路径参数）
   * @headers Content-Type: application/json
   * @body    {
   *            "username": "lisi",
   *            "age": 30
   *          }
   * @note    只需传入要修改的字段
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  /**
   * 删除用户
   *
   * @route   DELETE /api/v1/user/:id
   * @url     http://localhost:3000/api/v1/user/1
   * @param   id - 用户ID（路径参数）
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
