import {
  IsString,
  MinLength,
  IsEmail,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name!: string;

  @IsEmail()
  @IsOptional()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
