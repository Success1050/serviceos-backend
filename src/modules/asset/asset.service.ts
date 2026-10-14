import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus, Prisma } from '@prisma/client';
import { TenancyUtil } from '../../core/shared/utils/tenancy.util';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(user: any, createAssetDto: CreateAssetDto) {
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createAssetDto.customerRecordId },
      include: { tenant: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found');
    }

    if (!TenancyUtil.isAuthorizedForTenant(user, customer.tenantId, customer.tenant?.parentId)) {
      throw new BadRequestException('You do not have permission to register assets for this customer');
    }

    const tenantId = customer.tenantId;

    return this.prisma.asset.create({
      data: {
        tenantId,
        name: createAssetDto.name,
        manufacturer: createAssetDto.manufacturer,
        modelNumber: createAssetDto.modelNumber,
        serialNumber: createAssetDto.serialNumber,
        installDate: createAssetDto.installDate ? new Date(createAssetDto.installDate) : null,
        warrantyExpiresAt: createAssetDto.warrantyExpiresAt
          ? new Date(createAssetDto.warrantyExpiresAt)
          : null,
        warrantyDocumentUrl: createAssetDto.warrantyDocumentUrl,
        customerRecordId: createAssetDto.customerRecordId,
        status: createAssetDto.status || AssetStatus.ACTIVE,
      },
      include: {
        customerRecord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
          },
        },
      },
    });
  }

  async getAssets(
    user: any,
    query?: {
      search?: string;
      status?: AssetStatus;
      customerRecordId?: string;
      tenantId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? Math.min(query.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const tenantFilter = TenancyUtil.getTenantScopeFilter(user, query?.tenantId);
    const andClauses: any[] = [];

    if (Object.keys(tenantFilter).length > 0) {
      andClauses.push(tenantFilter);
    }

    if (query?.status) {
      andClauses.push({ status: query.status });
    }

    if (query?.customerRecordId) {
      andClauses.push({ customerRecordId: query.customerRecordId });
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      andClauses.push({
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { manufacturer: { contains: s, mode: 'insensitive' } },
          { modelNumber: { contains: s, mode: 'insensitive' } },
          { serialNumber: { contains: s, mode: 'insensitive' } },
          {
            customerRecord: {
              name: { contains: s, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    const where: Prisma.AssetWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const [total, items] = await this.prisma.$transaction([
      this.prisma.asset.count({ where }),
      this.prisma.asset.findMany({
        where,
        include: {
          customerRecord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
            },
          },
          _count: {
            select: {
              serviceRequests: true,
              maintenanceSchedules: true,
              supportTickets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAsset(user: any, assetId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const where: Prisma.AssetWhereInput = {
      id: assetId,
      ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
    };

    const asset = await this.prisma.asset.findFirst({
      where,
      include: {
        customerRecord: true,
        serviceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        maintenanceSchedules: {
          orderBy: { nextDueDate: 'asc' },
          take: 5,
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset record not found or inaccessible');
    }

    return asset;
  }

  async updateAsset(user: any, assetId: string, updateAssetDto: UpdateAssetDto) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const existing = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
      include: { tenant: true },
    });

    if (!existing) {
      throw new NotFoundException('Asset record not found or inaccessible');
    }

    if (updateAssetDto.customerRecordId && updateAssetDto.customerRecordId !== existing.customerRecordId) {
      const customer = await this.prisma.customerRecord.findUnique({
        where: { id: updateAssetDto.customerRecordId },
        include: { tenant: true },
      });
      if (!customer || !TenancyUtil.isAuthorizedForTenant(user, customer.tenantId, customer.tenant?.parentId)) {
        throw new BadRequestException('Selected customer record does not belong to your authorized scope');
      }
    }

    const data: Prisma.AssetUpdateInput = {};

    if (updateAssetDto.name !== undefined) data.name = updateAssetDto.name;
    if (updateAssetDto.manufacturer !== undefined) data.manufacturer = updateAssetDto.manufacturer;
    if (updateAssetDto.modelNumber !== undefined) data.modelNumber = updateAssetDto.modelNumber;
    if (updateAssetDto.serialNumber !== undefined) data.serialNumber = updateAssetDto.serialNumber;
    if (updateAssetDto.warrantyDocumentUrl !== undefined)
      data.warrantyDocumentUrl = updateAssetDto.warrantyDocumentUrl;
    if (updateAssetDto.status !== undefined) data.status = updateAssetDto.status;

    if (updateAssetDto.installDate !== undefined) {
      data.installDate = updateAssetDto.installDate ? new Date(updateAssetDto.installDate) : null;
    }

    if (updateAssetDto.warrantyExpiresAt !== undefined) {
      data.warrantyExpiresAt = updateAssetDto.warrantyExpiresAt
        ? new Date(updateAssetDto.warrantyExpiresAt)
        : null;
    }

    if (updateAssetDto.customerRecordId !== undefined) {
      data.customerRecord = {
        connect: { id: updateAssetDto.customerRecordId },
      };
    }

    return this.prisma.asset.update({
      where: { id: assetId },
      data,
      include: {
        customerRecord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
          },
        },
      },
    });
  }

  async deleteAsset(user: any, assetId: string) {
    const tenantFilter = TenancyUtil.getTenantScopeFilter(user);
    const existing = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        ...(Object.keys(tenantFilter).length > 0 ? tenantFilter : {}),
      },
    });

    if (!existing) {
      throw new NotFoundException('Asset record not found or inaccessible');
    }

    await this.prisma.asset.delete({
      where: { id: assetId },
    });

    return {
      message: 'Asset removed successfully',
      id: assetId,
    };
  }
}
