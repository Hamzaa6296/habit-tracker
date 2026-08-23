/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './schemas/user-schema';

import { CreateUserDto } from './dto/create-user.dto';

import { UpdateUserDto } from './dto/update-user.dto';

import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  async create(createUserDto: CreateUserDto) {
    return this.userModel.create(createUserDto);
  }

  // --------------------------------------------------
  // FIND USER BY ID
  // --------------------------------------------------

  async findOne(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // --------------------------------------------------
  // FIND USER BY EMAIL
  // --------------------------------------------------

  async findByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({
      email: email.toLowerCase(),
    });

    if (includePassword) {
      query.select('+password');
    }

    return query.exec();
  }

  // --------------------------------------------------
  // UPDATE CURRENT USER
  // --------------------------------------------------

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // --------------------------------------------------
  // CHANGE PASSWORD
  // --------------------------------------------------

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(id).select('+password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatched = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!passwordMatched) {
      throw new BadRequestException('Current password is incorrect');
    }

    const samePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (samePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  // --------------------------------------------------
  // DELETE CURRENT USER
  // --------------------------------------------------

  async removeUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Account deleted successfully',
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
    },
  ) {
    if (data.email) {
      const existingUser = await this.userModel.findOne({
        email: data.email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(userId: string, includePassword = false) {
    const query = this.userModel.findById(userId);

    if (includePassword) {
      query.select('+password');
    }

    return query;
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
      },
      {
        new: true,
      },
    );
  }
}
