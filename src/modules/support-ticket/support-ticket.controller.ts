import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CreateStaffTicketDto } from './dto/create-staff-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { ResolveWarrantyDto } from './dto/resolve-warranty.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Controller('support-tickets')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @Permissions('manage_support_tickets', 'admin_access')
  async createTicket(
    @CurrentUser() user: any,
    @Body() createDto: CreateStaffTicketDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
    return this.supportTicketService.createStaffTicket(user.tenantId, user.id, staffName, createDto);
  }

  @Get()
  @Permissions('view_support_tickets', 'manage_support_tickets', 'admin_access')
  async getTickets(
    @CurrentUser() user: any,
    @Query() filterDto: FilterTicketsDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.supportTicketService.getTickets(user.tenantId, filterDto);
  }

  @Get('metrics')
  @Permissions('view_support_tickets', 'manage_support_tickets', 'admin_access')
  async getMetrics(
    @CurrentUser() user: any,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.supportTicketService.getSupportMetrics(user.tenantId);
  }

  @Get(':id')
  @Permissions('view_support_tickets', 'manage_support_tickets', 'admin_access')
  async getTicketDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.supportTicketService.getTicketDetails(user.tenantId, id, false);
  }

  @Post(':id/messages')
  @Permissions('manage_support_tickets', 'admin_access')
  async postMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() createMessageDto: CreateTicketMessageDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();

    return this.supportTicketService.addMessage(
      user.tenantId,
      id,
      {
        senderType: 'STAFF',
        senderUserId: user.id,
        senderName: staffName,
      },
      createMessageDto,
    );
  }

  @Patch(':id/status')
  @Permissions('manage_support_tickets', 'admin_access')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketStatusDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    return this.supportTicketService.updateTicketStatus(user.tenantId, id, updateDto, user.id);
  }

  @Post(':id/resolve-warranty')
  @Permissions('resolve_warranties', 'manage_support_tickets', 'admin_access')
  async resolveWarranty(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() resolveDto: ResolveWarrantyDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
    return this.supportTicketService.resolveWarrantyClaim(user.tenantId, id, resolveDto, user.id, staffName);
  }

  @Post(':id/resolve-dispute')
  @Permissions('resolve_disputes', 'manage_support_tickets', 'admin_access')
  async resolveDispute(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() resolveDto: ResolveDisputeDto,
  ) {
    if (!user.tenantId) throw new BadRequestException('User does not belong to a tenant');
    const staffName = `${user.firstName || 'Staff'} ${user.lastName || ''}`.trim();
    return this.supportTicketService.resolveChargeDispute(user.tenantId, id, resolveDto, user.id, staffName);
  }
}
