/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';

import { CheckinService } from './checkin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('habits/:habitId/checkins')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post()
  create(@CurrentUser() user: any, @Param('habitId') habitId: string) {
    return this.checkinService.create(user._id.toString(), habitId);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Param('habitId') habitId: string) {
    return this.checkinService.findAll(user._id.toString(), habitId);
  }

  @Delete(':checkInId')
  remove(
    @CurrentUser() user: any,
    @Param('habitId') habitId: string,
    @Param('checkInId') checkInId: string,
  ) {
    return this.checkinService.remove(user._id.toString(), habitId, checkInId);
  }
}
