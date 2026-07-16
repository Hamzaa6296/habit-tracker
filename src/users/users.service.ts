import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    return {
      message: 'create user - coming soon',
      data: createUserDto,
    };
  }

  findAll() {
    return {
      message: 'find all - coming soon',
    };
  }

  findOne(id: string) {
    return {
      message: `find user by ${id} coming soon`,
    };
  }

  UpdateUser(id: string, updateUserDto: UpdateUserDto) {
    return {
      message: `user update with ${id} service - coming soon`,
      data: updateUserDto,
    };
  }

  removeUser(id: string) {
    return {
      message: `remove user by ${id} is coming soon`,
    };
  }
}
