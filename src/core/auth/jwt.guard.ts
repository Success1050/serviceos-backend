import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly jwtSecret: Uint8Array;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const secretStr = this.configService.get<string>('JWT_SECRET') || 'super-secret-key-for-dev-only-do-not-use-in-prod';
    this.jwtSecret = new TextEncoder().encode(secretStr);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);
      // Attach the payload to the request object so our decorators can access it
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        relationshipId: payload.relationshipId, // Required for Customer Portal
        phone: payload.phone,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
