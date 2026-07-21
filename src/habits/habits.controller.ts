/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Param,
  Patch,
  Post,
  UseGuards,
  Get,
  Delete,
  Controller,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { createHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  create(@CurrentUser() user, @Body() dto: createHabitDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.habitsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.habitsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user, @Param(':id') id: string) {
    return this.habitsService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.userId, id, dto);
  }

  @Delete()
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.habitsService.remove(user.userId, id);
  }
}
