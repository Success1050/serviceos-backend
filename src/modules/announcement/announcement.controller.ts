import { Controller, Post, Get, Body } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.announcementService.create(user.tenantId, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.announcementService.findAllForTenant(user.tenantId);
  }
}
