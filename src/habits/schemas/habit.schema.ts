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
    enum: HabitFrequency,
    default: HabitFrequency.DAILY,
  })
  frequency!: HabitFrequency;

  @Prop({
    type: [Number],
    default: [] as number[],
  })
  customDays!: number[];

  @Prop({
    default: true,
  })
  isActive!: boolean;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
