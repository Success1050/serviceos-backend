import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCustomer(tenantId: string, createCustomerDto: CreateCustomerDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        tenantId: string;
        address: string | null;
        city: string | null;
    }>;
    inviteCustomer(tenantId: string, customerRecordId: string): Promise<{
        message: string;
        plainToken: string;
        expiresAt: Date;
    }>;
}
