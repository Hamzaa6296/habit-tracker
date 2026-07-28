import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { analyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { Habit, HabitSchema } from '../habits/schemas/habit.schema';
import { Checkin, CheckinSchema } from '../checkins/schemas/checkin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Habit.name,
        schema: HabitSchema,
      },
      {
        name: Checkin.name,
        schema: CheckinSchema,
      },
    ]),
  ],
  controllers: [analyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
