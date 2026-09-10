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
exports.JobService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let JobService = class JobService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createJob(tenantId, createJobDto) {
        const customer = await this.prisma.customerRecord.findUnique({
            where: { id: createJobDto.customerRecordId },
        });
        if (!customer || customer.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer record not found for this tenant');
        }
        if (createJobDto.assignedTechnicianId) {
            const tech = await this.prisma.user.findUnique({
                where: { id: createJobDto.assignedTechnicianId },
            });
            if (!tech || tech.tenantId !== tenantId) {
                throw new common_1.ForbiddenException('Invalid technician assigned');
            }
        }
        return this.prisma.job.create({
            data: {
                tenantId,
                title: createJobDto.title,
                description: createJobDto.description,
                customerRecordId: createJobDto.customerRecordId,
                quoteId: createJobDto.quoteId,
                assignedTechnicianId: createJobDto.assignedTechnicianId,
                scheduledAt: createJobDto.scheduledAt ? new Date(createJobDto.scheduledAt) : null,
            },
        });
    }
    async getJobs(tenantId, user) {
        const whereClause = { tenantId };
        if (user.permissions?.includes('technician_access')) {
            whereClause.assignedTechnicianId = user.id;
        }
        return this.prisma.job.findMany({
            where: whereClause,
            include: {
                customerRecord: {
                    select: { name: true, address: true }
                },
                assignedTechnician: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
    async updateJobStatus(tenantId, jobId, updateDto, user) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (user.permissions?.includes('technician_access') && job.assignedTechnicianId !== user.id) {
            throw new common_1.ForbiddenException('You can only update your own assigned jobs');
        }
        const data = { status: updateDto.status };
        if (updateDto.status === 'IN_PROGRESS' && !job.startedAt) {
            data.startedAt = new Date();
        }
        if (updateDto.status === 'COMPLETED' && !job.completedAt) {
            data.completedAt = new Date();
        }
        return this.prisma.job.update({
            where: { id: jobId },
            data,
        });
    }
};
exports.JobService = JobService;
exports.JobService = JobService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobService);
//# sourceMappingURL=job.service.js.map