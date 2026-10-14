import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @Permissions('admin_access')
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customerService.getCustomers(user, {
      search,
      status,
      tenantId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @Permissions('admin_access')
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.customerService.getCustomer(user, id);
  }

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customerService.createCustomer(user, createCustomerDto);
  }

  @Post(':id/invite')
  @Permissions('admin_access')
  async invite(
    @CurrentUser() user: any,
    @Param('id') customerId: string,
  ) {
    return this.customerService.inviteCustomer(user, customerId);
  }
}
