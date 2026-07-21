import { PartialType } from '@nestjs/mapped-types';
import { createHabitDto } from './create-habit.dto';

export class UpdateHabitDto extends PartialType(createHabitDto) {}
