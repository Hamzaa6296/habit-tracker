import { IsDateString } from 'class-validator';

export class CreateCheckinDto {
  @IsDateString()
  date!: string;
}
