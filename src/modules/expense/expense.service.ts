import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async submitExpense(tenantId: string, technicianId: string, data: CreateExpenseDto) {
    // 1. Verify job exists and belongs to tenant
    const job = await this.prisma.job.findFirst({ where: { id: data.jobId, tenantId } });
    if (!job) throw new NotFoundException('Job not found');

    // 2. Create the pending expense receipt
    return this.prisma.expenseReceipt.create({
      data: {
        tenantId,
        jobId: data.jobId,
        technicianId,
        amount: data.amount,
        receiptPhotoUrl: data.receiptPhotoUrl,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async getExpenses(tenantId: string, status?: string) {
    const whereClause: any = { tenantId };
    if (status) {
      whereClause.status = status;
    }

    return this.prisma.expenseReceipt.findMany({
      where: whereClause,
      include: {
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveExpense(tenantId: string, expenseId: string) {
    const expense = await this.prisma.expenseReceipt.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) throw new NotFoundException('Expense receipt not found');
    if (expense.status !== 'PENDING_APPROVAL') throw new BadRequestException('Expense is not pending');

    return this.prisma.expenseReceipt.update({
      where: { id: expenseId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectExpense(tenantId: string, expenseId: string) {
    const expense = await this.prisma.expenseReceipt.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) throw new NotFoundException('Expense receipt not found');
    if (expense.status !== 'PENDING_APPROVAL') throw new BadRequestException('Expense is not pending');

    return this.prisma.expenseReceipt.update({
      where: { id: expenseId },
      data: { status: 'REJECTED' },
    });
  }
}
