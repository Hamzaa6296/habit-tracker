import { IsArray, IsOptional, IsEnum, IsString } from 'class-validator';
import { HabitFrequency } from '../schemas/habit.schema';

export class createHabitDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  discription?: string;

  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @IsOptional()
  @IsArray()
  customDays?: number[];
}
