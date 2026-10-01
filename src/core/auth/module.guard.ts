import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ServiceModule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_MODULE_KEY } from '../decorators/require-module.decorator';
import { ModuleRestrictedException } from '../exceptions/module-restricted.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredModules = this.reflector.getAllAndOverride<ServiceModule[]>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform SuperAdmins bypass module gating for debugging and administration
    if (user?.isSuperAdmin) {
      return true;
    }

    let tenantId = user?.tenantId;

    // Support public portal routes where tenant is identified by slug parameter
    if (!tenantId && request.params?.slug) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: request.params.slug },
        select: { id: true },
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      return true;
    }

    // Fetch tenant, parent status, and direct subscription
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!tenant) {
      return true;
    }

    if (tenant.isSuspended) {
      throw new ForbiddenException(
        `This business account has been suspended: ${
          tenant.suspensionReason || 'Contact platform administration.'
        }`,
      );
    }

    let activeSubscription = tenant.subscription;

    // Cascading Tier Inheritance: Sub-Companies inherit parent's subscription if none assigned
    if (!activeSubscription && tenant.parentId) {
      const parentTenant = await this.prisma.tenant.findUnique({
        where: { id: tenant.parentId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      if (parentTenant?.isSuspended) {
        throw new ForbiddenException('Parent enterprise franchise account is suspended.');
      }

      activeSubscription = parentTenant?.subscription ?? null;
    }

    if (!activeSubscription) {
      throw new ModuleRestrictedException(
        requiredModules[0],
        `No active subscription found for this organization. Please select a plan to activate ${requiredModules[0]}.`,
      );
    }

    if (activeSubscription.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'The subscription plan for this organization is currently suspended.',
      );
    }

    // Compute effective enabled modules
    const planModules = new Set<string>(activeSubscription.plan.enabledModules);
    (activeSubscription.additionalModules || []).forEach((m) => planModules.add(m));
    (activeSubscription.disabledModules || []).forEach((m) => planModules.delete(m));

    for (const mod of requiredModules) {
      if (!planModules.has(mod)) {
        throw new ModuleRestrictedException(mod);
      }
    }

    return true;
  }
}
