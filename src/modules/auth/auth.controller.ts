import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestTechPinDto } from './dto/request-tech-pin.dto';
import { VerifyTechPinDto } from './dto/verify-tech-pin.dto';
import { Public } from '../../core/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('reset-temp-password')
  async resetTempPassword(@Body() body: any) {
    return this.authService.resetTempPassword(body.email, body.tempPassword, body.newPassword);
  }

  /**
   * Stage 27: Passwordless SMS 4-Digit PIN Request for Field Technicians.
   */
  @Post('tech/request-pin')
  async requestTechPin(@Body() dto: RequestTechPinDto) {
    return this.authService.requestTechPin(dto);
  }

  /**
   * Stage 27: Passwordless SMS 4-Digit PIN Verification & JWT Issuance for Field Technicians.
   */
  @Post('tech/verify-pin')
  async verifyTechPin(@Body() dto: VerifyTechPinDto) {
    return this.authService.verifyTechPin(dto);
  }
}
