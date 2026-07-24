/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { CheckinService } from './checkin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@UseGuards(JwtAuthGuard)
@Controller('checkins')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post(':habitId')
  create(
    @CurrentUser() user: any,
    @Param('habitId') habitId: string,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.checkinService.create(user.userId, habitId, dto.date);
  }

  @Get(':habitId')
  findAll(@CurrentUser() user: any, @Param('habitId') habitId: string) {
    return this.checkinService.findAll(user.userId, habitId);
  }

  @Delete(':habitId')
  remove(
    @CurrentUser() user: any,
    @Param('habitId') habitId: string,
    @Param('checkinId') checkinId: string,
  ) {
    return this.checkinService.remove(user.userId, habitId, checkinId);
  }
}
