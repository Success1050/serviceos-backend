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
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let InvoiceService = class InvoiceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createInvoice(tenantId, createInvoiceDto) {
        const customer = await this.prisma.customerRecord.findUnique({
            where: { id: createInvoiceDto.customerRecordId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer record not found for this tenant');
        }
        if (createInvoiceDto.jobId) {
            const job = await this.prisma.job.findUnique({
                where: { id: createInvoiceDto.jobId },
            });
            if (!job || job.tenantId !== tenantId) {
                throw new common_1.BadRequestException('Invalid job assigned');
            }
        }
        return this.prisma.invoice.create({
            data: {
                tenantId,
                title: createInvoiceDto.title,
                amount: createInvoiceDto.amount,
                customerRecordId: createInvoiceDto.customerRecordId,
                jobId: createInvoiceDto.jobId,
                dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
                status: 'DRAFT',
            },
        });
    }
    async getInvoices(tenantId) {
        return this.prisma.invoice.findMany({
            where: { tenantId },
            include: {
                customerRecord: {
                    select: { name: true, email: true }
                },
                job: {
                    select: { title: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async sendInvoice(tenantId, invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
        });
        if (!invoice || invoice.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only DRAFT invoices can be sent');
        }
        return this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'SENT' },
        });
    }
    async markAsPaid(tenantId, invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
        });
        if (!invoice || invoice.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        });
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map