/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Habit, HabitDocument } from '../habits/schemas/habit.schema';
import { Checkin, CheckinDocument } from '../checkins/schemas/checkin.schema';
import { Model } from 'mongoose';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,

    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
  ) {}

  async getWeekly(userId: string) {
    return this.getAnalytics(userId, 7);
  }

  async getMonthly(userId: string) {
    return this.getAnalytics(userId, 30);
  }

  async getYearly(userId: string) {
    return this.getAnalytics(userId, 365);
  }

  private async getAnalytics(userId: string, days: number) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const checkins = await this.checkinModel.find({
      user: userId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    const habits = await this.habitModel.find({
      user: userId,
    });

    const dailyDate: Record<string, number> = {};

    checkins.forEach((checkin) => {
      const key = checkin.date.toISOString().split('T')[0];
      dailyDate[key] = (dailyDate[key] || 0) + 1;
    });

    const completionRate =
      habits.length === 0
        ? 0
        : Number(
            (
              habits.reduce((sum, habit) => sum + habit.completionRate, 0) /
              habits.length
            ).toFixed(2),
          );

    return {
      period: days,
      totalHabits: habits.length,
      totalCheckIns: checkins.length,
      completionRate,
      dailyDate,
    };
  }
}
