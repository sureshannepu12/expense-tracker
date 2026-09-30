import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';
import { MonthQueryDto } from '../common/dto/month-query.dto.js';
import { currentMonth } from '../common/month.js';
import { BudgetsService } from './budgets.service.js';
import { BudgetDto } from './dto/budget.dto.js';
import { UpsertBudgetDto } from './dto/upsert-budget.dto.js';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOkResponse({ type: [BudgetDto] })
  findBudgets(@CurrentUser() user: AuthUser, @Query() query: MonthQueryDto) {
    return this.budgetsService.findAll(user.id, query.month ?? currentMonth());
  }

  // PUT because the call is idempotent: sending the same body twice leaves one budget.
  @Put()
  @ApiOkResponse({ type: BudgetDto })
  upsertBudget(@CurrentUser() user: AuthUser, @Body() dto: UpsertBudgetDto) {
    return this.budgetsService.upsert(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeBudget(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.budgetsService.remove(user.id, id);
  }
}
