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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let MaintenanceService = class MaintenanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSchedule(tenantId, customerRecordId, dto) {
        if (dto.assetId) {
            const asset = await this.prisma.asset.findUnique({
                where: { id: dto.assetId },
            });
            if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== customerRecordId) {
                throw new common_1.BadRequestException('Invalid asset specified');
            }
        }
        return this.prisma.maintenanceSchedule.create({
            data: {
                tenantId,
                customerRecordId,
                assetId: dto.assetId,
                title: dto.title,
                intervalMonths: dto.intervalMonths,
                nextDueDate: new Date(dto.firstDueDate),
                status: 'ACTIVE',
            },
        });
    }
    async getUpcomingMaintenance(tenantId, daysLookahead = 30) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysLookahead);
        return this.prisma.maintenanceSchedule.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
                nextDueDate: { lte: targetDate },
            },
            include: {
                customerRecord: { select: { name: true, phone: true, address: true } },
                asset: { select: { name: true } },
            },
            orderBy: { nextDueDate: 'asc' },
        });
    }
    async generateJobsForDueSchedules() {
        const lookaheadDate = new Date();
        lookaheadDate.setDate(lookaheadDate.getDate() + 7);
        const dueSchedules = await this.prisma.maintenanceSchedule.findMany({
            where: {
                status: 'ACTIVE',
                nextDueDate: { lte: lookaheadDate },
                currentJobId: null,
            },
        });
        const generated = [];
        for (const schedule of dueSchedules) {
            await this.prisma.$transaction(async (prisma) => {
                const job = await prisma.job.create({
                    data: {
                        tenantId: schedule.tenantId,
                        customerRecordId: schedule.customerRecordId,
                        title: `[Maintenance] ${schedule.title}`,
                        description: `Automated maintenance job.`,
                        status: 'SCHEDULED',
                        scheduledAt: schedule.nextDueDate,
                    },
                });
                await prisma.maintenanceSchedule.update({
                    where: { id: schedule.id },
                    data: { currentJobId: job.id },
                });
                generated.push(job.id);
            });
        }
        return { processed: generated.length, jobs: generated };
    }
    async completeMaintenanceCycle(tenantId, scheduleId) {
        const schedule = await this.prisma.maintenanceSchedule.findUnique({
            where: { id: scheduleId },
        });
        if (!schedule || schedule.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Schedule not found or does not belong to your company');
        }
        const nextDue = new Date(schedule.nextDueDate);
        nextDue.setMonth(nextDue.getMonth() + schedule.intervalMonths);
        return this.prisma.maintenanceSchedule.update({
            where: { id: scheduleId },
            data: {
                nextDueDate: nextDue,
                currentJobId: null,
            },
        });
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map