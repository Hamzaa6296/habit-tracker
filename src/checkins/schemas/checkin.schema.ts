import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Habit } from '../../habits/schemas/habit.schema';

export type CheckinDocument = HydratedDocument<Checkin>;

@Schema({
  timestamps: true,
})
export class Checkin {
  @Prop({
    type: Types.ObjectId,
    ref: Habit.name,
    required: true,
  })
  habit!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: Types.ObjectId;

  @Prop({
    required: true,
  })
  date!: Date;
}

export const CheckinSchema = SchemaFactory.createForClass(Checkin);

CheckinSchema.index(
  {
    habit: 1,
    user: 1,
    date: 1,
  },
  {
    unique: true,
  },
);
