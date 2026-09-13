import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtGuard, PermissionsGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @Permissions('expense_view', 'expense_approve')
  async getExpenses(@Query('status') status: string, @CurrentUser() user: any) {
    return this.expenseService.getExpenses(user.tenantId, status);
  }

  @Post()
  @Permissions('expense_submit')
  async submitExpense(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.expenseService.submitExpense(user.tenantId, user.id, createExpenseDto);
  }

  @Patch(':id/approve')
  @Permissions('expense_approve')
  async approveExpense(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expenseService.approveExpense(user.tenantId, id);
  }

  @Patch(':id/reject')
  @Permissions('expense_approve')
  async rejectExpense(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expenseService.rejectExpense(user.tenantId, id);
  }
}
