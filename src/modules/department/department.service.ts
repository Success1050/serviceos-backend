import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async createDepartment(tenantId: string, name: string) {
    return this.prisma.department.create({
      data: {
        name,
        tenantId,
      },
    });
  }

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }

  async deleteDepartment(tenantId: string, id: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id, tenantId },
    });

    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }
}
