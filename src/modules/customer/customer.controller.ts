import { Controller, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Permissions('admin_access')
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
  @Permissions('admin_access')
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
