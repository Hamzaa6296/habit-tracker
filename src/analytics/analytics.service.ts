import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

  // =========================================================
  // HEATMAP
  // =========================================================

  async getHeatmap(userId: string, days = 126) {
    const userObjectId = new Types.ObjectId(userId);

    const today = new Date();

    const end = new Date(today);
    end.setUTCHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    const checkins = await this.checkinModel.find({
      user: userObjectId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    /*
     * Create every date first.
     *
     * This means days with no check-ins will still
     * appear in the heatmap with count = 0.
     */

    const dailyActivity: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(start);

      date.setUTCDate(start.getUTCDate() + i);

      const key = date.toISOString().split('T')[0];

      dailyActivity[key] = 0;
    }

    /*
     * Count check-ins for each day.
     */

    checkins.forEach((checkin) => {
      const key = checkin.date.toISOString().split('T')[0];

      if (dailyActivity[key] !== undefined) {
        dailyActivity[key]++;
      }
    });

    return {
      period: days,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalCheckIns: checkins.length,
      dailyActivity,
    };
  }

  // =========================================================
  // WEEKLY / MONTHLY / YEARLY ANALYTICS
  // =========================================================

  private async getAnalytics(userId: string, days: number) {
    const userObjectId = new Types.ObjectId(userId);

    const today = new Date();

    const end = new Date(today);
    end.setUTCHours(23, 59, 59, 999);

    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    const checkins = await this.checkinModel.find({
      user: userObjectId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    const habits = await this.habitModel.find({
      user: userObjectId,
      isActive: true,
    });

    const dailyDate: Record<string, number> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(start);

      date.setUTCDate(start.getUTCDate() + i);

      const key = date.toISOString().split('T')[0];

      dailyDate[key] = 0;
    }

    checkins.forEach((checkin) => {
      const key = checkin.date.toISOString().split('T')[0];

      if (dailyDate[key] !== undefined) {
        dailyDate[key]++;
      }
    });

    const totalPossibleCheckIns = habits.length * days;

    const completionRate =
      totalPossibleCheckIns === 0
        ? 0
        : Number(((checkins.length / totalPossibleCheckIns) * 100).toFixed(2));

    return {
      period: days,
      totalHabits: habits.length,
      totalCheckIns: checkins.length,
      completionRate,
      dailyDate,
    };
  }
}
