import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

  async createAsset(tenantId: string, createAssetDto: CreateAssetDto) {
    const customer = await this.prisma.customerRecord.findUnique({
      where: { id: createAssetDto.customerRecordId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new NotFoundException('Customer record not found for this tenant');
    }

    return this.prisma.asset.create({
      data: {
        tenantId,
        name: createAssetDto.name,
        manufacturer: createAssetDto.manufacturer,
        modelNumber: createAssetDto.modelNumber,
        serialNumber: createAssetDto.serialNumber,
        installDate: createAssetDto.installDate ? new Date(createAssetDto.installDate) : null,
        customerRecordId: createAssetDto.customerRecordId,
        status: 'ACTIVE',
      },
    });
  }

  async getAssets(tenantId: string) {
    return this.prisma.asset.findMany({
      where: { tenantId },
      include: {
        customerRecord: {
          select: { name: true, address: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
