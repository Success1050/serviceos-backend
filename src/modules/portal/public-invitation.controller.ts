import { Controller, Get, Post, Param } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../../core/decorators/public.decorator';

@Controller('invitations')
export class PublicInvitationController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get(':token')
  async getInvitation(@Param('token') token: string) {
    return this.portalService.getInvitationByToken('', token);
  }

  @Public()
  @Post(':token/claim')
  async claimInvitation(@Param('token') token: string) {
    return this.portalService.claimInvitation('', token);
  }
}
