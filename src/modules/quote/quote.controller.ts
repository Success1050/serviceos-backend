import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { QuoteStatus, ServiceModule } from '@prisma/client';
import { RequireModule } from '../../core/decorators/require-module.decorator';

@Controller('quotes')
@RequireModule(ServiceModule.MODULE_QUOTES)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @Permissions('admin_access')
  async create(
    @CurrentUser() user: any,
    @Body() createQuoteDto: CreateQuoteDto,
  ) {
    return this.quoteService.createQuote(user, createQuoteDto);
  }

  @Get()
  @Permissions('admin_access')
  async findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: QuoteStatus,
    @Query('customerRecordId') customerRecordId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quoteService.getQuotes(user, {
      search,
      status,
      customerRecordId,
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
    return this.quoteService.getQuote(user, id);
  }

  @Patch(':id')
  @Permissions('admin_access')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateQuoteDto: UpdateQuoteDto,
  ) {
    return this.quoteService.updateQuote(user, id, updateQuoteDto);
  }

  @Post(':id/send')
  @Permissions('admin_access')
  async send(
    @CurrentUser() user: any,
    @Param('id') quoteId: string,
  ) {
    return this.quoteService.sendQuote(user, quoteId);
  }

  @Delete(':id')
  @Permissions('admin_access')
  async remove(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.quoteService.deleteQuote(user, id);
  }
}
