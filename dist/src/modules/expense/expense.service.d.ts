import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpenseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submitExpense(tenantId: string, technicianId: string, data: CreateExpenseDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ExpenseStatus;
        tenantId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string;
        receiptPhotoUrl: string;
        technicianId: string;
    }>;
    getExpenses(tenantId: string, status?: string): Promise<({
        job: {
            id: string;
            title: string;
        };
        technician: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ExpenseStatus;
        tenantId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string;
        receiptPhotoUrl: string;
        technicianId: string;
    })[]>;
    approveExpense(tenantId: string, expenseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ExpenseStatus;
        tenantId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string;
        receiptPhotoUrl: string;
        technicianId: string;
    }>;
    rejectExpense(tenantId: string, expenseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ExpenseStatus;
        tenantId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        jobId: string;
        receiptPhotoUrl: string;
        technicianId: string;
    }>;
}
