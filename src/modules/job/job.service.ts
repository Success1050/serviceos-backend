import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { Role } from '@prisma/client';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(tenantId: string, createJobDto: CreateJobDto) {
    // 1. Verify customer record belongs to tenant
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createJobDto.customerRecordId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException('Customer record not found for this tenant');
    }

    // 2. Verify technician if assigned
    if (createJobDto.assignedTechnicianId) {
      const tech = await this.prisma.user.findUnique({
        where: { id: createJobDto.assignedTechnicianId },
      });

      if (!tech || tech.tenantId !== tenantId) {
        throw new ForbiddenException('Invalid technician assigned');
      }
    }

    // 3. Create job
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

  async getJobs(tenantId: string, user: any) {
    const whereClause: any = { tenantId };

    // If the user is a technician, they can ONLY see their own jobs
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

  async updateJobStatus(tenantId: string, jobId: string, updateDto: UpdateJobStatusDto, user: any) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.tenantId !== tenantId) {
      throw new NotFoundException('Job not found');
    }

    // Technicians can only update their own jobs
    if (user.permissions?.includes('technician_access') && job.assignedTechnicianId !== user.id) {
      throw new ForbiddenException('You can only update your own assigned jobs');
    }

    const data: any = { status: updateDto.status };

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
}
