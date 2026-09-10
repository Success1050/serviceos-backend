import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.parentId) {
      throw new ForbiddenException('Only HQ can create announcements');
    }

    return this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority || 'NORMAL',
        targetTenants: dto.targetTenants || [],
      },
    });
  }

  async findAllForTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    
    // If HQ, return all announcements they created
    if (!tenant?.parentId) {
      return this.prisma.announcement.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    }

    // If sub-company, return announcements from their HQ where targetTenants is empty OR contains their ID
    return this.prisma.announcement.findMany({
      where: {
        tenantId: tenant.parentId,
        OR: [
          { targetTenants: { equals: [] } },
          { targetTenants: { has: tenantId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
