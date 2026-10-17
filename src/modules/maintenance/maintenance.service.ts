import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMaintenanceScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSchedules(tenantId: string) {
    return this.prisma.maintenanceSchedule.findMany({
      where: { tenantId },
      include: {
        customerRecord: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        asset: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            modelNumber: true,
            serialNumber: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async createSchedule(tenantId: string, customerRecordId: string | undefined, dto: CreateMaintenanceScheduleDto) {
    const finalCustomerId = customerRecordId || dto.customerRecordId || dto.customerId;
    if (!finalCustomerId) {
      throw new BadRequestException('A valid customer is required for the maintenance schedule');
    }

    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: finalCustomerId },
    });
    if (!customer || customer.tenantId !== tenantId) {
      throw new BadRequestException('Customer record not found');
    }

    if (dto.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: dto.assetId },
      });
      if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== finalCustomerId) {
        throw new BadRequestException('Invalid asset specified for this customer');
      }
    }

    return this.prisma.maintenanceSchedule.create({
      data: {
        tenantId,
        customerRecordId: finalCustomerId,
        assetId: dto.assetId || null,
        title: dto.title,
        intervalMonths: dto.intervalMonths,
        nextDueDate: new Date(dto.firstDueDate),
        status: 'ACTIVE',
      },
      include: {
        customerRecord: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        asset: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            modelNumber: true,
            serialNumber: true,
          },
        },
      },
    });
  }

  async updateScheduleStatus(tenantId: string, scheduleId: string, status: any) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.tenantId !== tenantId) {
      throw new BadRequestException('Schedule not found');
    }

    return this.prisma.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: { status },
      include: {
        customerRecord: { select: { id: true, name: true, phone: true } },
        asset: { select: { id: true, name: true } },
      },
    });
  }

  async getUpcomingMaintenance(tenantId: string, daysLookahead: number = 30) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysLookahead);

    return this.prisma.maintenanceSchedule.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        nextDueDate: { lte: targetDate },
      },
      include: {
        customerRecord: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        asset: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            modelNumber: true,
            serialNumber: true,
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async generateJobsForDueSchedules() {
    const lookaheadDate = new Date();
    lookaheadDate.setDate(lookaheadDate.getDate() + 7); // Generate 7 days in advance

    const dueSchedules = await this.prisma.maintenanceSchedule.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: { lte: lookaheadDate },
        currentJobId: null, // Avoid duplicate generation
      },
    });

    const generated: string[] = [];

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

  async completeMaintenanceCycle(tenantId: string, scheduleId: string) {
    const schedule = await this.prisma.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule || schedule.tenantId !== tenantId) {
      throw new BadRequestException('Schedule not found or does not belong to your company');
    }

    const nextDue = new Date(schedule.nextDueDate);
    nextDue.setMonth(nextDue.getMonth() + schedule.intervalMonths);

    return this.prisma.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: {
        nextDueDate: nextDue,
        currentJobId: null, // Reset so it can generate again next cycle
      },
    });
  }
}
