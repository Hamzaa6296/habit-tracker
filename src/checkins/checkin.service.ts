import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { Model, Types } from 'mongoose';

import { Habit, HabitDocument } from '../habits/schemas/habit.schema';
import { Checkin, CheckinDocument } from './schemas/checkin.schema';

import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,

    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,
  ) {}
  async create(userId: string, habitId: string, date: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });
    if (!habit) throw new NotFoundException('Habit not found');
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    try {
      return await this.checkinModel.create({
        habit: new Types.ObjectId(habitId),
        user: new Types.ObjectId(userId),
        date: normalizedDate,
      });
    } catch {
      throw new BadRequestException('habit already checkedin for this day');
    }
  }

  async findAll(userId: string, habitId: string) {
    return this.checkinModel
      .find({
        user: userId,
        habit: habitId,
      })
      .sort({
        date: -1,
      });
  }

  async remove(userId: string, habitId: string, checkinId: string) {
    const checkin = await this.checkinModel.findByIdAndDelete({
      _id: checkinId,
      user: userId,
      habit: habitId,
    });

    if (!checkin) {
      throw new NotFoundException('checkin not found');
    }

    return {
      message: 'checkin deleted successfully',
    };
  }
}
