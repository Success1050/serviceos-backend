import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { TokenUtil } from '../../core/shared/utils/token.util';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async createCustomer(tenantId: string, createCustomerDto: CreateCustomerDto) {
    // 1. Create the base CRM record for the business
    const customer = await this.prisma.customerRecord.create({
      data: {
        tenantId,
        name: createCustomerDto.name,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        city: createCustomerDto.city,
      },
    });

    return customer;
  }

  async inviteCustomer(tenantId: string, customerRecordId: string) {
    // 1. Verify customer record belongs to tenant
    const customerRecord = await this.prisma.customerRecord.findUnique({
      where: { id: customerRecordId },
    });

    if (!customerRecord || customerRecord.tenantId !== tenantId) {
      throw new NotFoundException('Customer record not found for this tenant');
    }

    // 2. Upsert CustomerTenantRelationship
    let relationship = await this.prisma.customerTenantRelationship.findUnique({
      where: {
        tenantId_customerRecordId: {
          tenantId,
          customerRecordId,
        }
      }
    });

    if (!relationship) {
      relationship = await this.prisma.customerTenantRelationship.create({
        data: {
          tenantId,
          customerRecordId,
          status: 'INVITATION_PENDING',
        }
      });
    }

    // 3. Generate Secure Token
    const plainToken = TokenUtil.generateSecureToken();
    const tokenHash = TokenUtil.hashToken(plainToken);

    // 4. Create Invitation Record (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.invitation.create({
      data: {
        tokenHash,
        relationshipId: relationship.id,
        status: 'PENDING',
        expiresAt,
      }
    });

    // 5. In a real app, we would dispatch an Email/SMS event here.
    return {
      message: 'Invitation generated successfully',
      plainToken, // The frontend will construct: https://serviceos.com/invite/<plainToken>
      expiresAt,
    };
  }
}
