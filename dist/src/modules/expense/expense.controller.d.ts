import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpenseController {
    private readonly expenseService;
    constructor(expenseService: ExpenseService);
    getExpenses(status: string, user: any): Promise<({
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
    submitExpense(createExpenseDto: CreateExpenseDto, user: any): Promise<{
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
    approveExpense(id: string, user: any): Promise<{
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
    rejectExpense(id: string, user: any): Promise<{
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
