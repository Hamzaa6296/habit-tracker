/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Habit, HabitDocument } from './schemas/habit.schema';
import { createHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,
  ) {}

  async create(userId: string, dto: createHabitDto) {
    const userObjectId = new Types.ObjectId(userId);

    return this.habitModel.create({
      ...dto,
      user: userObjectId,
    });
  }

  async findAll(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    return this.habitModel.find({
      user: userObjectId,
      isActive: true,
    });
  }

  async findOne(userId: string, habitId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userObjectId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    const userObjectId = new Types.ObjectId(userId);

    const habit = await this.habitModel.findOneAndUpdate(
      {
        _id: habitId,
        user: userObjectId,
      },
      {
        $set: dto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  async remove(userId: string, habitId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const habit = await this.habitModel.findOneAndDelete({
      _id: habitId,
      user: userObjectId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return {
      message: 'Habit deleted successfully',
    };
  }

  async updateStatistics(
    habitId: string,
    stats: {
      currentStreak: number;
      longestStreak: number;
      totalCheckIns: number;
      completionRate: number;
      lastCompletedAt: Date | null;
    },
  ) {
    return this.habitModel.findByIdAndUpdate(habitId, stats, {
      new: true,
    });
  }

  async findOwnedHabit(userId: string, habitId: string) {
    const userObjectId = new Types.ObjectId(userId);

    return this.habitModel.findOne({
      _id: habitId,
      user: userObjectId,
    });
  }

  async getStatistics(userId: string, habitId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userObjectId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return {
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCheckIns: habit.totalCheckIns,
      completionRate: habit.completionRate,
      lastCompletedAt: habit.lastCompletedAt,
    };
  }
}
