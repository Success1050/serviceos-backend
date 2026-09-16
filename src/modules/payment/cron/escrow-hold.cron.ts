import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PaymentService } from '../payment.service';

@Injectable()
export class EscrowHoldCronService {
  private readonly logger = new Logger(EscrowHoldCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Runs every hour to find upcoming site visits within 24 hours and place pre-arrival card holds.
   */
  @Cron(CronExpression.EVERY_HOUR)
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
        paymentHoldStatus: null, // Hold has not been placed yet
      },
    });

    this.logger.log(`Found ${upcomingJobs.length} upcoming site job(s) requiring payment pre-authorization hold.`);

    for (const job of upcomingJobs) {
      try {
        await this.paymentService.authorizePreArrivalHoldForJob(job.id);
      } catch (err: any) {
        this.logger.error(`Failed to process pre-arrival hold for Job ${job.id}: ${err.message}`);
      }
    }
  }

  /**
   * Solution for Long-Term Jobs:
   * Scans active 7-day holds that are within 48 hours of expiration on ongoing jobs, and executes rolling re-authorization.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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
          // Release the old expiring hold once new hold is in place
          await this.paymentService.releaseEscrowHold(hold.id, hold.tenantId, 'Rolling re-authorization for long-term project');
        } catch (err: any) {
          this.logger.error(`Failed rolling re-authorization for hold ${hold.id}: ${err.message}`);
        }
      }
    }
  }
}
