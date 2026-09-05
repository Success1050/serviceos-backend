import { Controller, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  async create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }
    return this.customerService.createCustomer(user.tenantId, createCustomerDto);
  }

  @Post(':id/invite')
  @Roles(Role.TENANT_OWNER, Role.TENANT_ADMIN, Role.MANAGER, Role.SALES)
  async invite(
    @CurrentUser() user: any,
    @Param('id') customerId: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }
    return this.customerService.inviteCustomer(user.tenantId, customerId);
  }
}
