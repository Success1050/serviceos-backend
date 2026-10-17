import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { JwtGuard } from '../../core/auth/jwt.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ApproveExpenseDto, RejectExpenseDto } from './dto/review-expense.dto';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { Permissions } from '../../core/decorators/permissions.decorator';

@UseGuards(JwtGuard, PermissionsGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get('metrics')
  @Permissions('expense_view', 'expense_approve', 'admin_access', 'manage_jobs')
  async getMetrics(@CurrentUser() user: any) {
    return this.expenseService.getExpenseMetrics(user.tenantId);
  }

  @Get()
  @Permissions('expense_view', 'expense_approve', 'admin_access', 'manage_jobs')
  async getExpenses(
    @Query('status') status: string,
    @Query('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    return this.expenseService.getExpenses(user.tenantId, status, jobId);
  }

  @Post()
  @Permissions('expense_submit', 'manage_expenses', 'admin_access', 'manage_jobs')
  async submitExpense(@Body() createExpenseDto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.expenseService.submitExpense(user.tenantId, user.id, createExpenseDto);
  }

  @Patch(':id/approve')
  @Permissions('expense_approve', 'admin_access')
  async approveExpense(
    @Param('id') id: string,
    @Body() dto: ApproveExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.expenseService.approveExpense(user.tenantId, id, user.id, dto);
  }

  @Patch(':id/reject')
  @Permissions('expense_approve', 'admin_access')
  async rejectExpense(
    @Param('id') id: string,
    @Body() dto: RejectExpenseDto,
    @CurrentUser() user: any,
  ) {
    return this.expenseService.rejectExpense(user.tenantId, id, user.id, dto);
  }

  // Alias for /review as mentioned in master plan
  @Patch(':id/review')
  @Permissions('expense_approve', 'admin_access')
  async reviewExpense(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; billToClient?: boolean; reason?: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    if (body.action === 'APPROVE') {
      return this.expenseService.approveExpense(user.tenantId, id, user.id, {
        billToClient: body.billToClient,
        notes: body.notes,
      });
    } else {
      return this.expenseService.rejectExpense(user.tenantId, id, user.id, {
        reason: body.reason,
      });
    }
  }
}
