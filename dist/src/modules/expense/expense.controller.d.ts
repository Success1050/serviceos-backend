import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpenseController {
    private readonly expenseService;
    constructor(expenseService: ExpenseService);
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
}
