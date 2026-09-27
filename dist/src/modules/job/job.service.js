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
const payment_service_1 = require("../payment/payment.service");
let JobService = class JobService {
    prisma;
    paymentService;
    constructor(prisma, paymentService) {
        this.prisma = prisma;
        this.paymentService = paymentService;
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
            if (createJobDto.scheduledAt) {
                await this.checkSchedulingConflicts(tenantId, createJobDto.assignedTechnicianId, new Date(createJobDto.scheduledAt), createJobDto.estimatedDuration || 60);
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
                estimatedDuration: createJobDto.estimatedDuration || 60,
            },
        });
    }
    async getJobs(tenantId, user) {
        const whereClause = { tenantId };
        if (user.permissions?.includes('technician_access')) {
            whereClause.assignedTechnicianId = user.id;
        }
        const jobs = await this.prisma.job.findMany({
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
        if (user.permissions?.includes('technician_access')) {
            return jobs.map(({ completionOtp, ...rest }) => rest);
        }
        return jobs;
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
        const now = new Date();
        if (updateDto.status === 'EN_ROUTE' && job.status !== 'EN_ROUTE') {
            if (job.paymentHoldStatus === 'HOLD_FAILED') {
                throw new common_1.ForbiddenException('Cannot proceed to site: Pre-arrival payment authorization failed. Customer must update payment method before technician deployment.');
            }
            data.enRouteAt = now;
        }
        else if (updateDto.status === 'IN_PROGRESS' && job.status !== 'IN_PROGRESS') {
            data.startedAt = now;
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            data.completionOtp = otp;
            data.completionOtpExpiresAt = new Date(now.getTime() + 24 * 60 * 60000);
            console.log(`[STAGE 23 - OTP GENERATED] Job ${jobId} requires OTP: ${otp} for completion.`);
        }
        else if (updateDto.status === 'COMPLETED' && job.status !== 'COMPLETED') {
            if (!job.completionOtp) {
                throw new common_1.ForbiddenException('Job cannot be completed because no OTP was generated.');
            }
            if (updateDto.otp !== job.completionOtp) {
                throw new common_1.ForbiddenException('Invalid completion OTP. Cannot close job without customer verification.');
            }
            if (job.completionOtpExpiresAt && job.completionOtpExpiresAt < now) {
                throw new common_1.ForbiddenException('OTP has expired.');
            }
            data.completedAt = now;
            data.completionOtp = null;
            try {
                await this.paymentService.captureEscrowHoldForJob(job.id, job.tenantId);
            }
            catch (escrowErr) {
                console.error(`[STAGE 24 - ESCROW CAPTURE ERROR] Failed for job ${job.id}:`, escrowErr.message);
            }
        }
        if (updateDto.latitude && updateDto.longitude && job.assignedTechnicianId) {
            await this.prisma.user.update({
                where: { id: job.assignedTechnicianId },
                data: {
                    lastKnownLatitude: updateDto.latitude,
                    lastKnownLongitude: updateDto.longitude,
                    lastLocationUpdate: now,
                }
            });
        }
        const updatedJob = await this.prisma.job.update({
            where: { id: jobId },
            data,
        });
        if (user.permissions?.includes('technician_access')) {
            const { completionOtp, ...rest } = updatedJob;
            return rest;
        }
        return updatedJob;
    }
    async updateTechnicianLocation(tenantId, jobId, dto, user) {
        const job = await this.prisma.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (user.permissions?.includes('technician_access') && job.assignedTechnicianId !== user.id) {
            throw new common_1.ForbiddenException('You can only stream location updates for your own assigned jobs');
        }
        const techId = job.assignedTechnicianId || user.id;
        const now = new Date();
        const updatedTech = await this.prisma.user.update({
            where: { id: techId },
            data: {
                lastKnownLatitude: dto.latitude,
                lastKnownLongitude: dto.longitude,
                lastLocationUpdate: now,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                lastKnownLatitude: true,
                lastKnownLongitude: true,
                lastLocationUpdate: true,
            },
        });
        return {
            success: true,
            jobId: job.id,
            technician: updatedTech,
            timestamp: now,
        };
    }
    async checkSchedulingConflicts(tenantId, technicianId, proposedStart, estimatedDurationMinutes) {
        const proposedEnd = new Date(proposedStart.getTime() + estimatedDurationMinutes * 60000);
        const conflictingJobs = await this.prisma.job.findMany({
            where: {
                tenantId,
                assignedTechnicianId: technicianId,
                status: { in: ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'] },
                scheduledAt: { not: null },
            },
        });
        for (const job of conflictingJobs) {
            const existingStart = job.scheduledAt;
            const existingEnd = new Date(existingStart.getTime() + (job.estimatedDuration || 60) * 60000);
            if (proposedStart < existingEnd && proposedEnd > existingStart) {
                throw new common_1.ConflictException(`Technician is already double-booked for another job at ${existingStart.toISOString()}`);
            }
        }
    }
};
exports.JobService = JobService;
exports.JobService = JobService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_service_1.PaymentService])
], JobService);
//# sourceMappingURL=job.service.js.map