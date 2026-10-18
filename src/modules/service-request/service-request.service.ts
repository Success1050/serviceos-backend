import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createRequest(tenantId: string, customerRecordId: string, createDto: CreateServiceRequestDto) {
    // Optionally verify asset if provided
    if (createDto.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: createDto.assetId },
      });

      if (!asset || asset.tenantId !== tenantId || asset.customerRecordId !== customerRecordId) {
        throw new BadRequestException('Invalid asset specified');
      }
    }

    return this.prisma.serviceRequest.create({
      data: {
        tenantId,
        customerRecordId,
        description: createDto.description,
        assetId: createDto.assetId,
        status: 'OPEN',
        urgency: (createDto.urgency as any) || 'NORMAL',
        preferredDate: createDto.preferredDate ? new Date(createDto.preferredDate) : null,
        preferredTimeSlot: createDto.preferredTimeSlot || null,
        attachments: createDto.attachments || [],
      },
    });
  }

  async getRequests(tenantId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { tenantId },
      include: {
        customerRecord: { select: { id: true, name: true, phone: true, address: true, email: true } },
        asset: { select: { name: true, serialNumber: true, warrantyExpiresAt: true } },
        job: { select: { id: true, title: true, status: true, scheduledAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(tenantId: string, requestId: string, updateDto: UpdateServiceRequestStatusDto) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.tenantId !== tenantId) {
      throw new NotFoundException('Service request not found');
    }

    if (updateDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: updateDto.jobId },
      });

      if (!job || job.tenantId !== tenantId) {
        throw new BadRequestException('Invalid job specified');
      }
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: updateDto.status,
        jobId: updateDto.jobId !== undefined ? updateDto.jobId : undefined,
      },
    });

    // Broadcast realtime update to tenant WebSocket rooms (portal and backoffice)
    this.notificationService.broadcastEvent(tenantId, 'realtime_update', {
      entity: 'service-request',
      action: 'status_updated',
      requestId,
      status: updateDto.status,
      jobId: updateDto.jobId,
    });

    return updated;
  }
}
