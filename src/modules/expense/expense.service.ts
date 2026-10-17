import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ApproveExpenseDto, RejectExpenseDto } from './dto/review-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async submitExpense(tenantId: string, callerId: string, data: CreateExpenseDto) {
    // 1. Verify job exists and belongs to tenant
    const job = await this.prisma.job.findFirst({
      where: { id: data.jobId, tenantId },
      include: { assignedTechnician: true },
    });
    if (!job) throw new NotFoundException('Job not found for this tenant');

    // 2. Determine technician: either explicit (e.g. manager submitting on behalf) or the caller
    const technicianId = data.technicianId || job.assignedTechnicianId || callerId;

    // 3. Create the pending expense receipt
    return this.prisma.expenseReceipt.create({
      data: {
        tenantId,
        jobId: data.jobId,
        technicianId,
        amount: data.amount,
        receiptPhotoUrl: data.receiptPhotoUrl,
        category: data.category || 'MATERIALS_PARTS',
        vendor: data.vendor || 'Local Hardware / Electrical Store',
        notes: data.notes,
        billToClient: Boolean(data.billToClient),
        status: 'PENDING_APPROVAL',
      },
      include: {
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            customerRecord: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
  }

  async getExpenses(tenantId: string, status?: string, jobId?: string) {
    const whereClause: any = { tenantId };
    if (status && status !== 'ALL') {
      whereClause.status = status as any;
    }
    if (jobId) {
      whereClause.jobId = jobId;
    }

    return this.prisma.expenseReceipt.findMany({
      where: whereClause,
      include: {
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            customerRecord: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExpenseMetrics(tenantId: string) {
    const expenses = await this.prisma.expenseReceipt.findMany({
      where: { tenantId },
      select: { amount: true, status: true },
    });

    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      if (exp.status === 'PENDING_APPROVAL') {
        pendingCount++;
        pendingAmount += amt;
      } else if (exp.status === 'APPROVED') {
        approvedCount++;
        approvedAmount += amt;
      } else if (exp.status === 'REJECTED') {
        rejectedCount++;
        rejectedAmount += amt;
      }
    }

    return {
      totalCount: expenses.length,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      rejectedCount,
      rejectedAmount,
    };
  }

  async approveExpense(tenantId: string, expenseId: string, reviewerId?: string, dto?: ApproveExpenseDto) {
    const expense = await this.prisma.expenseReceipt.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) throw new NotFoundException('Expense receipt not found');
    if (expense.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Expense cannot be approved because it is currently ${expense.status}`);
    }

    return this.prisma.expenseReceipt.update({
      where: { id: expenseId },
      data: {
        status: 'APPROVED',
        billToClient: dto?.billToClient ?? expense.billToClient,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        notes: dto?.notes ? `${expense.notes ? expense.notes + ' | ' : ''}Approved: ${dto.notes}` : expense.notes,
      },
      include: {
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            customerRecord: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async rejectExpense(tenantId: string, expenseId: string, reviewerId?: string, dto?: RejectExpenseDto) {
    const expense = await this.prisma.expenseReceipt.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!expense) throw new NotFoundException('Expense receipt not found');
    if (expense.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Expense cannot be rejected because it is currently ${expense.status}`);
    }

    return this.prisma.expenseReceipt.update({
      where: { id: expenseId },
      data: {
        status: 'REJECTED',
        rejectionReason: dto?.reason || 'Receipt details do not match work order or failed inspection.',
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
      include: {
        technician: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            customerRecord: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}
