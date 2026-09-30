import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';
import { MonthQueryDto } from '../common/dto/month-query.dto.js';
import { currentMonth } from '../common/month.js';
import {
  DateRangeQueryDto,
  MonthlyTrendQueryDto,
} from './dto/report-query.dto.js';
import {
  CategoryTotalDto,
  MonthlyTotalDto,
  SummaryDto,
} from './dto/report.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOkResponse({ type: SummaryDto })
  getSummary(@CurrentUser() user: AuthUser, @Query() query: MonthQueryDto) {
    return this.reportsService.summary(user.id, query.month ?? currentMonth());
  }

  @Get('by-category')
  @ApiOkResponse({ type: [CategoryTotalDto] })
  getSpendingByCategory(
    @CurrentUser() user: AuthUser,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.reportsService.byCategory(user.id, query.from, query.to);
  }

  @Get('monthly')
  @ApiOkResponse({ type: [MonthlyTotalDto] })
  getMonthlyTrend(
    @CurrentUser() user: AuthUser,
    @Query() query: MonthlyTrendQueryDto,
  ) {
    return this.reportsService.monthly(
      user.id,
      query.months ?? 6,
      query.endMonth,
    );
  }
}
