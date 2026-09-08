import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { InternalTicketService } from './internal-ticket.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';

@Controller('internal-tickets')
export class InternalTicketController {
  constructor(private readonly internalTicketService: InternalTicketService) {}

  @Post()
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.internalTicketService.createTicket(user.tenantId, user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.internalTicketService.getTickets(user);
  }

  @Patch(':id/status')
  @Roles('TENANT_OWNER', 'TENANT_ADMIN')
  async updateStatus(@Param('id') id: string, @Body('status') status: any, @CurrentUser() user: any) {
    return this.internalTicketService.updateTicketStatus(user, id, status);
  }
}
