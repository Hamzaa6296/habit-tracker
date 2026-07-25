import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CheckinController } from './checkin.controller';
import { CheckinsService } from './checkin.service';

import { Checkin, CheckinSchema } from './schemas/checkin.schema';

import { Habit, HabitSchema } from '../habits/schemas/habit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Checkin.name,
        schema: CheckinSchema,
      },
      {
        name: Habit.name,
        schema: HabitSchema,
      },
    ]),
  ],
  controllers: [CheckinController],
  providers: [CheckinsService],
})
export class CheckinModule {}
