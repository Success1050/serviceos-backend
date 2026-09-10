import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Role } from '@prisma/client';

@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createQuoteDto: CreateQuoteDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }
    return this.quoteService.createQuote(user.tenantId, createQuoteDto);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(@CurrentUser() user: any) {
    if (!user.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }
    return this.quoteService.getQuotes(user.tenantId);
  }

  @Post(':id/send')
  @Permissions('admin_access')
  async send(
    @CurrentUser() user: any,
    @Param('id') quoteId: string,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('User does not belong to a tenant');
    }
    return this.quoteService.sendQuote(user.tenantId, quoteId);
  }
}
