import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

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
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
