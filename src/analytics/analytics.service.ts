/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Habit, HabitDocument } from '../habits/schemas/habit.schema';

import { Checkin, CheckinDocument } from '../checkins/schemas/checkin.schema';

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
    const today = new Date();

    // Normalize today to UTC midnight
    const end = new Date(today);
    end.setUTCHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    const checkins = await this.checkinModel.find({
      user: userId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    const habits = await this.habitModel.find({
      user: userId,
      isActive: true,
    });

    /*
     * Create every date in the requested period.
     *
     * This is important because otherwise dates without
     * check-ins simply don't exist in dailyDate.
     */
    const dailyDate: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(start);

      date.setUTCDate(start.getUTCDate() + i);

      const key = date.toISOString().split('T')[0];

      dailyDate[key] = 0;
    }

    /*
     * Count check-ins for each day.
     */
    checkins.forEach((checkin) => {
      const key = checkin.date.toISOString().split('T')[0];

      if (dailyDate[key] !== undefined) {
        dailyDate[key]++;
      }
    });

    /*
     * Calculate completion rate for this period.
     *
     * For now we treat active habits as daily habits.
     * We can make this frequency-aware later for:
     * daily / weekly / custom habits.
     */
    const totalPossibleCheckins = habits.length * days;

    const completionRate =
      totalPossibleCheckins === 0
        ? 0
        : Number(((checkins.length / totalPossibleCheckins) * 100).toFixed(2));

    return {
      period: days,
      totalHabits: habits.length,
      totalCheckIns: checkins.length,
      completionRate,
      dailyDate,
    };
  }
}
