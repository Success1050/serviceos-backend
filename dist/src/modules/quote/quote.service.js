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
exports.QuoteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let QuoteService = class QuoteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createQuote(tenantId, createQuoteDto) {
        const customer = await this.prisma.customerRecord.findUnique({
            where: { id: createQuoteDto.customerRecordId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer record not found for this tenant');
        }
        const quote = await this.prisma.quote.create({
            data: {
                tenantId,
                customerRecordId: createQuoteDto.customerRecordId,
                title: createQuoteDto.title,
                amount: createQuoteDto.amount,
                status: 'DRAFT',
            },
        });
        return quote;
    }
    async getQuotes(tenantId) {
        return this.prisma.quote.findMany({
            where: { tenantId },
            include: {
                customerRecord: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async sendQuote(tenantId, quoteId) {
        const quote = await this.prisma.quote.findUnique({
            where: { id: quoteId },
        });
        if (!quote || quote.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Quote not found for this tenant');
        }
        if (quote.status !== 'DRAFT') {
            throw new Error('Only DRAFT quotes can be sent');
        }
        return this.prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'SENT' },
        });
    }
};
exports.QuoteService = QuoteService;
exports.QuoteService = QuoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuoteService);
//# sourceMappingURL=quote.service.js.map