/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Habit, HabitDocument } from '../habits/schemas/habit.schema';
import { Checkin, CheckinDocument } from '../checkins/schemas/checkin.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,

    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
  ) {}

  async getDashboard(userId: string) {
    const habits = await this.habitModel.find({
      user: userId,
    });

    const totalHabits = habits.length;

    const activeHabits = habits.filter((habit) => habit.isActive).length;

    const totalCheckIns = habits.reduce(
      (sum, habit) => sum + habit.totalCheckIns,
      0,
    );

    const overallCompletionRate =
      totalHabits === 0
        ? 0
        : Number(
            habits.reduce((sum, habit) => sum + habit.completionRate, 0) /
              totalHabits,
          ).toFixed(2);

    const longestCurrentStreak = habits.reduce(
      (max, habit) => Math.max(max, habit.currentStreak),
      0,
    );

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const completedToday = await this.checkinModel.countDocuments({
      user: userId,
      date: today,
    });

    const recentHabits = habits
      .sort((a, b) => {
        const at = (a as any)?.updatedAt ? (a as any).updatedAt.getTime() : 0;
        const bt = (b as any)?.updatedAt ? (b as any).updatedAt.getTime() : 0;
        return bt - at;
      })
      .slice(0, 5)
      .map((habit) => ({
        id: habit._id,
        title: habit.title,
        currentStreak: habit.currentStreak,
        totalCheckIns: habit.totalCheckIns,
      }));

    return {
      totalHabits,
      activeHabits,
      completedToday,
      totalCheckIns,
      overallCompletionRate,
      longestCurrentStreak,
      recentHabits,
    };
  }
}
