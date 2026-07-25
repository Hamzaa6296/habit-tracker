/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user-schema';

export type HabitDocument = HydratedDocument<Habit>;

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
}

@Schema({
  timestamps: true,
})
export class Habit {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    trim: true,
    default: '',
  })
  discription!: string;

  @Prop({
    type: String,
    enum: HabitFrequency,
    default: HabitFrequency.DAILY,
  })
  frequency!: HabitFrequency;

  @Prop({
    type: [Number],
    default: [] as number[],
  })
  weekDays!: number[];
  @Prop({
    type: [Number],
    default: [] as number[],
  })
  monthDays!: number[];

  @Prop({
    default: true,
  })
  isActive!: boolean;

  // chached stats

  @Prop({
    default: 0,
  })
  currentStreak!: number;

  @Prop({
    default: 0,
  })
  longestStreak!: number;

  @Prop({
    default: 0,
  })
  totalCheckIns!: number;
  @Prop({
    default: 0,
  })
  completionRate!: number;
  @Prop({
    default: 0,
  })
  lastCompletedAt!: number;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
