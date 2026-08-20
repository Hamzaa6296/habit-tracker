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

  create(userId: string, dto: createHabitDto) {
    return this.habitModel.create({
      ...dto,
      user: new Types.ObjectId(userId),
    });
  }

  async findAll(userId: string) {
    const habits = await this.habitModel.find({
      user: new Types.ObjectId(userId),
    });
    return habits;
  }

  async findOne(userId: string, habitId: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });

    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    const habit = await this.habitModel.findOneAndUpdate(
      {
        _id: habitId,
        user: userId,
      },
      dto,
      {
        new: true,
      },
    );

    if (!habit) {
      throw new NotFoundException('habit not found');
    }
    return habit;
  }

  async remove(userId: string, habitId: string) {
    const habit = await this.habitModel.findOneAndDelete({
      _id: habitId,
      user: userId,
    });

    if (!habit) {
      throw new NotFoundException('habit not found');
    }
    return {
      message: 'habit deleted successfully',
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
    return this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });
  }

  async getStatistics(userId: string, habitId: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });

    if (!habit) {
      throw new NotFoundException('habit not found');
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
