import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    create(user: any, createCustomerDto: CreateCustomerDto): Promise<{
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
    invite(user: any, customerId: string): Promise<{
        message: string;
        plainToken: string;
        expiresAt: Date;
    }>;
}
