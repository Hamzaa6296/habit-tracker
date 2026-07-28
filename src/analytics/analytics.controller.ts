/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class analyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly')
  weekly(@CurrentUser() user) {
    return this.analyticsService.getWeekly(user._id.toString());
  }

  @Get('monthly')
  monthly(@CurrentUser() user) {
    return this.analyticsService.getMonthly(user._id.toString());
  }

  @Get('yearly')
  yearly(@CurrentUser() user) {
    return this.analyticsService.getYearly(user._id.toString());
  }
}
