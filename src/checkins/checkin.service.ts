/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Checkin, CheckinDocument } from './schemas/checkin.schema';

import {
  Habit,
  HabitDocument,
  HabitFrequency,
} from '../habits/schemas/habit.schema';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,

    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,
  ) {}

  // =========================================================
  // CREATE CHECK-IN
  // =========================================================

  async create(userId: string, habitId: string) {
    const habit = await this.habitModel.findById(habitId);

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    // Make sure the habit belongs to the authenticated user
    if (habit.user.toString() !== userId) {
      throw new NotFoundException('Habit not found');
    }

    const today = this.normalizeDate(new Date());

    // Prevent duplicate check-in for the same habit/day
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

    // Recalculate all cached statistics
    await this.updateHabitStatistics(habitId);

    return checkin;
  }

  // =========================================================
  // GET ALL CHECK-INS
  // =========================================================

  async findAll(userId: string, habitId: string) {
    const habit = await this.habitModel.findById(habitId);

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.user.toString() !== userId) {
      throw new NotFoundException('Habit not found');
    }

    return this.checkinModel
      .find({
        habit: habit._id,
        user: habit.user,
      })
      .sort({
        date: -1,
      });
  }

  // =========================================================
  // DELETE CHECK-IN
  // =========================================================

  async remove(userId: string, habitId: string, checkInId: string) {
    const habit = await this.habitModel.findById(habitId);

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.user.toString() !== userId) {
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

    // Recalculate statistics after deletion
    await this.updateHabitStatistics(habitId);

    return {
      message: 'Check-in deleted successfully',
    };
  }

  // =========================================================
  // UPDATE HABIT STATISTICS
  // =========================================================

  private async updateHabitStatistics(habitId: string): Promise<void> {
    const habit = await this.habitModel.findById(habitId);

    if (!habit) {
      return;
    }

    const checkins = await this.checkinModel
      .find({
        habit: habit._id,
        user: habit.user,
      })
      .sort({
        date: 1,
      });

    const totalCheckIns = checkins.length;

    const lastCompletedAt =
      totalCheckIns > 0 ? checkins[totalCheckIns - 1].date.getTime() : 0;

    const currentStreak = this.calculateCurrentStreak(habit, checkins);

    const longestStreak = this.calculateLongestStreak(habit, checkins);

    const createdAt = habit.get('createdAt') as Date;

    const completionRate = this.calculateCompletionRate(
      habit,
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

  // =========================================================
  // CURRENT STREAK
  // =========================================================

  private calculateCurrentStreak(
    habit: HabitDocument,
    checkins: CheckinDocument[],
  ): number {
    if (!checkins.length) {
      return 0;
    }

    const dates = this.getUniqueSortedDates(checkins);

    /*
     * Current streak starts from the most recent
     * completed scheduled day.
     */

    let streak = 1;

    for (let i = dates.length - 1; i > 0; i--) {
      const current = dates[i];
      const previous = dates[i - 1];

      const expectedPrevious = this.getPreviousScheduledDate(habit, current);

      if (!expectedPrevious) {
        break;
      }

      if (this.isSameDay(previous, expectedPrevious)) {
        streak++;
      } else {
        break;
      }
    }

    /*
     * If the most recent check-in is not the latest
     * scheduled occurrence, the streak is no longer active.
     *
     * Example daily habit:
     *
     * Wednesday ✓
     * Thursday ✗
     * Friday ✓
     *
     * Friday streak = 1.
     *
     * Example Monday/Wednesday/Friday habit:
     *
     * Monday ✓
     * Wednesday ✓
     * Friday ✓
     *
     * Friday streak = 3.
     */

    const latestCheckin = dates[dates.length - 1];

    const latestExpectedDate = this.getLatestScheduledDateOnOrBefore(
      habit,
      new Date(),
    );

    if (
      latestExpectedDate &&
      !this.isSameDay(latestCheckin, latestExpectedDate)
    ) {
      return 0;
    }

    return streak;
  }

  // =========================================================
  // LONGEST STREAK
  // =========================================================

  private calculateLongestStreak(
    habit: HabitDocument,
    checkins: CheckinDocument[],
  ): number {
    if (!checkins.length) {
      return 0;
    }

    const dates = this.getUniqueSortedDates(checkins);

    let current = 1;
    let longest = 1;

    for (let i = 1; i < dates.length; i++) {
      const currentDate = dates[i];
      const previousDate = dates[i - 1];

      const expectedPrevious = this.getPreviousScheduledDate(
        habit,
        currentDate,
      );

      if (expectedPrevious && this.isSameDay(previousDate, expectedPrevious)) {
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

  // =========================================================
  // PREVIOUS SCHEDULED DATE
  // =========================================================

  private getPreviousScheduledDate(
    habit: HabitDocument,
    currentDate: Date,
  ): Date | null {
    /*
     * DAILY
     *
     * Previous occurrence is simply yesterday.
     */

    if (habit.frequency === HabitFrequency.DAILY) {
      const previous = new Date(currentDate);

      previous.setUTCDate(previous.getUTCDate() - 1);

      return this.normalizeDate(previous);
    }

    /*
     * WEEKLY / CUSTOM
     *
     * We use weekDays.
     *
     * Convention:
     *
     * 1 = Monday
     * 2 = Tuesday
     * 3 = Wednesday
     * 4 = Thursday
     * 5 = Friday
     * 6 = Saturday
     * 7 = Sunday
     */

    const weekDays = this.getScheduledWeekDays(habit);

    if (!weekDays.length) {
      return null;
    }

    const current = this.normalizeDate(currentDate);

    /*
     * Search backwards up to 7 days for the
     * previous scheduled occurrence.
     */

    for (let i = 1; i <= 7; i++) {
      const candidate = new Date(current);

      candidate.setUTCDate(candidate.getUTCDate() - i);

      const weekday = this.getWeekDayNumber(candidate);

      if (weekDays.includes(weekday)) {
        return candidate;
      }
    }

    return null;
  }

  // =========================================================
  // LATEST SCHEDULED DATE
  // =========================================================

  private getLatestScheduledDateOnOrBefore(
    habit: HabitDocument,
    date: Date,
  ): Date | null {
    const current = this.normalizeDate(date);

    if (habit.frequency === HabitFrequency.DAILY) {
      return current;
    }

    const weekDays = this.getScheduledWeekDays(habit);

    if (!weekDays.length) {
      return null;
    }

    for (let i = 0; i <= 7; i++) {
      const candidate = new Date(current);

      candidate.setUTCDate(candidate.getUTCDate() - i);

      const weekday = this.getWeekDayNumber(candidate);

      if (weekDays.includes(weekday)) {
        return candidate;
      }
    }

    return null;
  }

  // =========================================================
  // GET SCHEDULED WEEKDAYS
  // =========================================================

  private getScheduledWeekDays(habit: HabitDocument): number[] {
    if (!habit.weekDays || !habit.weekDays.length) {
      return [];
    }

    return [...habit.weekDays].sort((a, b) => a - b);
  }

  // =========================================================
  // WEEKDAY NUMBER
  // =========================================================

  private getWeekDayNumber(date: Date): number {
    const day = date.getUTCDay();

    /*
     * JavaScript:
     *
     * Sunday = 0
     * Monday = 1
     * ...
     * Saturday = 6
     *
     * Our application:
     *
     * Monday = 1
     * ...
     * Sunday = 7
     */

    return day === 0 ? 7 : day;
  }

  // =========================================================
  // UNIQUE + SORTED DATES
  // =========================================================

  private getUniqueSortedDates(checkins: CheckinDocument[]): Date[] {
    const timestamps = new Set<number>();

    checkins.forEach((checkin) => {
      const date = this.normalizeDate(checkin.date);

      timestamps.add(date.getTime());
    });

    return Array.from(timestamps)
      .sort((a, b) => a - b)
      .map((timestamp) => new Date(timestamp));
  }

  // =========================================================
  // NORMALIZE DATE
  // =========================================================

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);

    normalized.setUTCHours(0, 0, 0, 0);

    return normalized;
  }

  // =========================================================
  // SAME DAY
  // =========================================================

  private isSameDay(first: Date, second: Date): boolean {
    return first.getTime() === second.getTime();
  }

  // =========================================================
  // COMPLETION RATE
  // =========================================================

  private calculateCompletionRate(
    habit: HabitDocument,
    createdAt: Date,
    totalCheckIns: number,
  ): number {
    const today = this.normalizeDate(new Date());
    const created = this.normalizeDate(createdAt);

    if (created > today) {
      return 0;
    }

    /*
     * Calculate how many scheduled occurrences
     * were possible since the habit was created.
     */

    let possibleCheckIns = 0;

    const current = new Date(created);

    while (current <= today) {
      if (this.isScheduledDate(habit, current)) {
        possibleCheckIns++;
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (possibleCheckIns === 0) {
      return 0;
    }

    return Number(((totalCheckIns / possibleCheckIns) * 100).toFixed(2));
  }

  // =========================================================
  // IS SCHEDULED DATE
  // =========================================================

  private isScheduledDate(habit: HabitDocument, date: Date): boolean {
    if (habit.frequency === HabitFrequency.DAILY) {
      return true;
    }

    const weekDays = this.getScheduledWeekDays(habit);

    if (!weekDays.length) {
      return false;
    }

    return weekDays.includes(this.getWeekDayNumber(date));
  }
}
