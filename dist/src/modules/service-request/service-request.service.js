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
exports.ServiceRequestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let ServiceRequestService = class ServiceRequestService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRequest(tenantId, customerRecordId, createDto) {
        if (createDto.assetId) {
            const asset = await this.prisma.asset.findUnique({
                where: { id: createDto.assetId },
            });
            if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== customerRecordId) {
                throw new common_1.BadRequestException('Invalid asset specified');
            }
        }
        return this.prisma.serviceRequest.create({
            data: {
                tenantId,
                customerRecordId,
                description: createDto.description,
                assetId: createDto.assetId,
                status: 'OPEN',
            },
        });
    }
    async getRequests(tenantId) {
        return this.prisma.serviceRequest.findMany({
            where: { tenantId },
            include: {
                customerRecord: { select: { name: true, phone: true } },
                asset: { select: { name: true, serialNumber: true, warrantyExpiresAt: true } },
                job: { select: { title: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(tenantId, requestId, updateDto) {
        const request = await this.prisma.serviceRequest.findUnique({
            where: { id: requestId },
        });
        if (!request || request.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Service request not found');
        }
        if (updateDto.jobId) {
            const job = await this.prisma.job.findUnique({
                where: { id: updateDto.jobId },
            });
            if (!job || job.tenantId !== tenantId) {
                throw new common_1.BadRequestException('Invalid job specified');
            }
        }
        return this.prisma.serviceRequest.update({
            where: { id: requestId },
            data: {
                status: updateDto.status,
                jobId: updateDto.jobId !== undefined ? updateDto.jobId : undefined,
            },
        });
    }
};
exports.ServiceRequestService = ServiceRequestService;
exports.ServiceRequestService = ServiceRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiceRequestService);
//# sourceMappingURL=service-request.service.js.map