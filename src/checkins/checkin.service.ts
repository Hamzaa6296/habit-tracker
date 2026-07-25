/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Checkin, CheckinDocument } from './schemas/checkin.schema';

import { Habit, HabitDocument } from '../habits/schemas/habit.schema';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,

    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,
  ) {}

  async create(userId: string, habitId: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const exists = await this.checkinModel.findOne({
      habit: habit._id,
      user: habit.user,
      date: today,
    });

    if (exists) {
      throw new BadRequestException('Habit already completed today');
    }

    const checkin = await this.checkinModel.create({
      habit: habit._id,
      user: habit.user,
      date: today,
    });

    await this.updateHabitStatistics(habitId);

    return checkin;
  }

  async findAll(userId: string, habitId: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.checkinModel
      .find({
        habit: habit._id,
      })
      .sort({
        date: -1,
      });
  }

  async remove(userId: string, habitId: string, checkInId: string) {
    const habit = await this.habitModel.findOne({
      _id: habitId,
      user: userId,
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const deleted = await this.checkinModel.findOneAndDelete({
      _id: checkInId,
      habit: habit._id,
      user: habit.user,
    });

    if (!deleted) {
      throw new NotFoundException('Check-in not found');
    }

    await this.updateHabitStatistics(habitId);

    return {
      message: 'Check-in deleted successfully',
    };
  }

  // --------------------------------------------------

  private async updateHabitStatistics(habitId: string): Promise<void> {
    const habit = await this.habitModel.findById(habitId);

    if (!habit) {
      return;
    }

    const checkins = await this.checkinModel
      .find({
        habit: habit._id,
      })
      .sort({
        date: 1,
      });

    const totalCheckIns = checkins.length;

    const lastCompletedAt =
      totalCheckIns > 0 ? checkins[totalCheckIns - 1].date.getTime() : 0;

    const currentStreak = this.calculateCurrentStreak(checkins);

    const longestStreak = this.calculateLongestStreak(checkins);

    const createdAt = habit.get('createdAt') as Date;

    const completionRate = this.calculateCompletionRate(
      createdAt,
      totalCheckIns,
    );

    habit.currentStreak = currentStreak;
    habit.longestStreak = longestStreak;
    habit.totalCheckIns = totalCheckIns;
    habit.completionRate = completionRate;
    habit.lastCompletedAt = lastCompletedAt;

    await habit.save();
  }

  // --------------------------------------------------

  private calculateCurrentStreak(checkins: CheckinDocument[]): number {
    if (!checkins.length) {
      return 0;
    }

    const dates = checkins.map((c) => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    let streak = 1;

    for (let i = dates.length - 1; i > 0; i--) {
      const current = dates[i];

      const previous = dates[i - 1];

      const diff =
        (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // --------------------------------------------------

  private calculateLongestStreak(checkins: CheckinDocument[]): number {
    if (!checkins.length) {
      return 0;
    }

    const dates = checkins.map((c) => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    let current = 1;

    let longest = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff =
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current++;

        if (current > longest) {
          longest = current;
        }
      } else {
        current = 1;
      }
    }

    return longest;
  }

  // --------------------------------------------------

  private calculateCompletionRate(
    createdAt: Date,
    totalCheckIns: number,
  ): number {
    const today = new Date();

    const days =
      Math.floor(
        (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    if (days <= 0) {
      return 0;
    }

    return Number(((totalCheckIns / days) * 100).toFixed(2));
  }
}
