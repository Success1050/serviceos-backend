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
var EscrowHoldCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowHoldCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const payment_service_1 = require("../payment.service");
let EscrowHoldCronService = EscrowHoldCronService_1 = class EscrowHoldCronService {
    prisma;
    paymentService;
    logger = new common_1.Logger(EscrowHoldCronService_1.name);
    constructor(prisma, paymentService) {
        this.prisma = prisma;
        this.paymentService = paymentService;
    }
    async scanUpcomingJobsForPreArrivalHold() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        this.logger.log(`Scanning upcoming site jobs scheduled between now and ${in24Hours.toISOString()} for pre-arrival payment holds...`);
        const upcomingJobs = await this.prisma.job.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledAt: {
                    gt: now,
                    lte: in24Hours,
                },
                paymentHoldStatus: null,
            },
        });
        this.logger.log(`Found ${upcomingJobs.length} upcoming site job(s) requiring payment pre-authorization hold.`);
        for (const job of upcomingJobs) {
            try {
                await this.paymentService.authorizePreArrivalHoldForJob(job.id);
            }
            catch (err) {
                this.logger.error(`Failed to process pre-arrival hold for Job ${job.id}: ${err.message}`);
            }
        }
    }
    async scanLongTermJobsForRollingReauthorization() {
        const now = new Date();
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        this.logger.log('Scanning long-term jobs for rolling escrow re-authorizations...');
        const expiringHolds = await this.prisma.escrowHold.findMany({
            where: {
                status: 'HELD',
                expiresAt: {
                    lte: in48Hours,
                    gt: now,
                },
                job: {
                    status: {
                        in: ['SCHEDULED', 'IN_PROGRESS'],
                    },
                },
            },
            include: {
                job: true,
            },
        });
        this.logger.log(`Found ${expiringHolds.length} long-term hold(s) nearing 7-day expiration.`);
        for (const hold of expiringHolds) {
            if (hold.jobId) {
                try {
                    this.logger.log(`Executing rolling 5-day re-authorization for long-term Job ${hold.jobId}`);
                    await this.paymentService.authorizePreArrivalHoldForJob(hold.jobId, hold.tenantId);
                    await this.paymentService.releaseEscrowHold(hold.id, hold.tenantId, 'Rolling re-authorization for long-term project');
                }
                catch (err) {
                    this.logger.error(`Failed rolling re-authorization for hold ${hold.id}: ${err.message}`);
                }
            }
        }
    }
};
exports.EscrowHoldCronService = EscrowHoldCronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EscrowHoldCronService.prototype, "scanUpcomingJobsForPreArrivalHold", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EscrowHoldCronService.prototype, "scanLongTermJobsForRollingReauthorization", null);
exports.EscrowHoldCronService = EscrowHoldCronService = EscrowHoldCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_service_1.PaymentService])
], EscrowHoldCronService);
//# sourceMappingURL=escrow-hold.cron.js.map