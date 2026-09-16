import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

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

      // Stage 22: Smart Scheduling Conflict Engine
      if (createJobDto.scheduledAt) {
        await this.checkSchedulingConflicts(
          tenantId,
          createJobDto.assignedTechnicianId,
          new Date(createJobDto.scheduledAt),
          createJobDto.estimatedDuration || 60,
        );
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
        estimatedDuration: createJobDto.estimatedDuration || 60,
      },
    });
  }

  async getJobs(tenantId: string, user: any) {
    const whereClause: any = { tenantId };

    // If the user is a technician, they can ONLY see their own jobs
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

    // Technicians should never see the completionOtp (customer provides it)
    if (user.permissions?.includes('technician_access')) {
      return jobs.map(({ completionOtp, ...rest }) => rest);
    }

    return jobs;
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
    const now = new Date();

    // Stage 22 & 23 & 24: Time Tracking, Site Protection & OTP Logic
    if (updateDto.status === 'EN_ROUTE' && job.status !== 'EN_ROUTE') {
      // Stage 24: Site Visit Protection Gate
      if (job.paymentHoldStatus === 'HOLD_FAILED') {
        throw new ForbiddenException(
          'Cannot proceed to site: Pre-arrival payment authorization failed. Customer must update payment method before technician deployment.',
        );
      }
      data.enRouteAt = now;
    } else if (updateDto.status === 'IN_PROGRESS' && job.status !== 'IN_PROGRESS') {
      data.startedAt = now;
      
      // Stage 23: Uber-style OTP Generation
      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
      data.completionOtp = otp;
      data.completionOtpExpiresAt = new Date(now.getTime() + 24 * 60 * 60000); // 24 hours
      
      // In a real scenario, trigger NotificationService/SMS here:
      console.log(`[STAGE 23 - OTP GENERATED] Job ${jobId} requires OTP: ${otp} for completion.`);
      
    } else if (updateDto.status === 'COMPLETED' && job.status !== 'COMPLETED') {
      // Stage 23: OTP Verification
      if (!job.completionOtp) {
        throw new ForbiddenException('Job cannot be completed because no OTP was generated.');
      }
      if (updateDto.otp !== job.completionOtp) {
        throw new ForbiddenException('Invalid completion OTP. Cannot close job without customer verification.');
      }
      if (job.completionOtpExpiresAt && job.completionOtpExpiresAt < now) {
        throw new ForbiddenException('OTP has expired.');
      }
      
      data.completedAt = now;
      data.completionOtp = null; // Clear OTP on successful use

      // Stage 24: Instant Escrow Capture upon verified site completion
      try {
        await this.paymentService.captureEscrowHoldForJob(job.id, job.tenantId);
      } catch (escrowErr: any) {
        console.error(`[STAGE 24 - ESCROW CAPTURE ERROR] Failed for job ${job.id}:`, escrowErr.message);
      }
    }

    // Stage 22: Geolocation tracking
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

  async updateTechnicianLocation(tenantId: string, jobId: string, dto: UpdateLocationDto, user: any) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.tenantId !== tenantId) {
      throw new NotFoundException('Job not found');
    }

    if (user.permissions?.includes('technician_access') && job.assignedTechnicianId !== user.id) {
      throw new ForbiddenException('You can only stream location updates for your own assigned jobs');
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

  // --- Private Helpers ---

  private async checkSchedulingConflicts(tenantId: string, technicianId: string, proposedStart: Date, estimatedDurationMinutes: number) {
    const proposedEnd = new Date(proposedStart.getTime() + estimatedDurationMinutes * 60000);

    // Find any overlapping jobs for this technician
    const conflictingJobs = await this.prisma.job.findMany({
      where: {
        tenantId,
        assignedTechnicianId: technicianId,
        status: { in: ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'] },
        scheduledAt: { not: null },
      },
    });

    for (const job of conflictingJobs) {
      const existingStart = job.scheduledAt!;
      const existingEnd = new Date(existingStart.getTime() + (job.estimatedDuration || 60) * 60000);

      // Overlap logic: Start A < End B && End A > Start B
      if (proposedStart < existingEnd && proposedEnd > existingStart) {
        throw new ConflictException(`Technician is already double-booked for another job at ${existingStart.toISOString()}`);
      }
    }
  }
}
