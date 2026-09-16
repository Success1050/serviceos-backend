"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let ExpenseService = class ExpenseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submitExpense(tenantId, technicianId, data) {
        const job = await this.prisma.job.findFirst({ where: { id: data.jobId, tenantId } });
        if (!job)
            throw new common_1.NotFoundException('Job not found');
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
    async getExpenses(tenantId, status) {
        const whereClause = { tenantId };
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
    async approveExpense(tenantId, expenseId) {
        const expense = await this.prisma.expenseReceipt.findFirst({
            where: { id: expenseId, tenantId },
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense receipt not found');
        if (expense.status !== 'PENDING_APPROVAL')
            throw new common_1.BadRequestException('Expense is not pending');
        return this.prisma.expenseReceipt.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' },
        });
    }
    async rejectExpense(tenantId, expenseId) {
        const expense = await this.prisma.expenseReceipt.findFirst({
            where: { id: expenseId, tenantId },
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense receipt not found');
        if (expense.status !== 'PENDING_APPROVAL')
            throw new common_1.BadRequestException('Expense is not pending');
        return this.prisma.expenseReceipt.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' },
        });
    }
};
exports.ExpenseService = ExpenseService;
exports.ExpenseService = ExpenseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpenseService);
//# sourceMappingURL=expense.service.js.map