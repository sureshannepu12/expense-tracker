import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
} from '../auth/decorators/current-user.decorator.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { ExpenseDto } from './dto/expense.dto.js';
import { PaginatedExpensesDto } from './dto/paginated-expenses.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedExpensesDto })
  findAllExpenses(
    @CurrentUser() user: AuthUser,
    @Query() query: ExpenseQueryDto,
  ) {
    return this.expensesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ExpenseDto })
  @ApiNotFoundResponse()
  findOneExpense(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.findOne(user.id, id);
  }

  @Post()
  @ApiCreatedResponse({ type: ExpenseDto })
  createExpense(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ExpenseDto })
  @ApiNotFoundResponse()
  updateExpense(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  removeExpense(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.expensesService.remove(user.id, id);
  }
}
