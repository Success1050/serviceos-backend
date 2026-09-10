import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('staff')
  async createStaff(@Body() createStaffDto: any, @CurrentUser() currentUser: any) {
    return this.userService.createStaff(createStaffDto, currentUser);
  }

  @Get('staff/pending')
  async getPendingStaff(@CurrentUser() currentUser: any) {
    return this.userService.getPendingStaff(currentUser);
  }

  @Patch('staff/:id/approve')
  async approveStaff(@Param('id') userId: string, @CurrentUser() currentUser: any) {
    return this.userService.approveStaff(userId, currentUser);
  }
}
