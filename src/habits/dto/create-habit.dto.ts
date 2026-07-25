import {
  IsArray,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
  ArrayUnique,
} from 'class-validator';
import { HabitFrequency } from '../schemas/habit.schema';

export class createHabitDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  discription?: string;

  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  weekDays?: number[];
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  monthDays?: number[];
}
