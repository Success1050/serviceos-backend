import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { AssignSubscriptionDto } from '../dto/assign-subscription.dto';
import { ServiceModule, SubscriptionTier } from '@prisma/client';

@Injectable()
export class SuperAdminSubscriptionService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  async seedDefaultPlans() {
    const plansCount = await this.prisma.subscriptionPlan.count();
    if (plansCount > 0) {
      return;
    }

    const defaultPlans = [
      {
        slug: 'starter',
        name: 'Starter Plan',
        tier: SubscriptionTier.STARTER,
        description: 'Core operations for small contractors and single-location shops.',
        priceMonthly: 99.0,
        priceAnnual: 990.0,
        currency: 'USD',
        maxSeats: 5,
        maxTechnicians: 5,
        maxBranches: 1,
        enabledModules: [
          ServiceModule.MODULE_CRM,
          ServiceModule.MODULE_QUOTES,
          ServiceModule.MODULE_INVOICES,
        ],
      },
      {
        slug: 'growth',
        name: 'Growth Plan',
        tier: SubscriptionTier.GROWTH,
        description:
          'Field dispatch, parts inventory, customer portal & support ticketing for growing teams.',
        priceMonthly: 299.0,
        priceAnnual: 2990.0,
        currency: 'USD',
        maxSeats: 15,
        maxTechnicians: 20,
        maxBranches: 3,
        enabledModules: [
          ServiceModule.MODULE_CRM,
          ServiceModule.MODULE_QUOTES,
          ServiceModule.MODULE_INVOICES,
          ServiceModule.MODULE_DISPATCH,
          ServiceModule.MODULE_WAREHOUSE,
          ServiceModule.MODULE_CUSTOMER_PORTAL,
          ServiceModule.MODULE_SUPPORT_DESK,
          ServiceModule.MODULE_BLUE_COLLAR_HR,
        ],
      },
      {
        slug: 'enterprise',
        name: 'Enterprise Franchise',
        tier: SubscriptionTier.ENTERPRISE,
        description:
          'Full-suite franchise network God-View, 3-tier fintech wallets, split-settlement payroll, and unlimited branches.',
        priceMonthly: 799.0,
        priceAnnual: 7990.0,
        currency: 'USD',
        maxSeats: 100,
        maxTechnicians: 200,
        maxBranches: 50,
        enabledModules: [
          ServiceModule.MODULE_CRM,
          ServiceModule.MODULE_QUOTES,
          ServiceModule.MODULE_INVOICES,
          ServiceModule.MODULE_DISPATCH,
          ServiceModule.MODULE_WAREHOUSE,
          ServiceModule.MODULE_CUSTOMER_PORTAL,
          ServiceModule.MODULE_SUPPORT_DESK,
          ServiceModule.MODULE_BLUE_COLLAR_HR,
          ServiceModule.MODULE_FINTECH_WALLETS,
          ServiceModule.MODULE_ENTERPRISE_HQ,
        ],
      },
    ];

    for (const plan of defaultPlans) {
      await this.prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });
  }

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Subscription plan with slug '${dto.slug}' already exists`);
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        tier: dto.tier || SubscriptionTier.GROWTH,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        priceAnnual: dto.priceAnnual,
        currency: dto.currency || 'USD',
        maxSeats: dto.maxSeats || 5,
        maxTechnicians: dto.maxTechnicians || 10,
        maxBranches: dto.maxBranches || 1,
        enabledModules: dto.enabledModules,
      },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto,
    });
  }

  async assignSubscription(tenantId: string, dto: AssignSubscriptionDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (dto.billingCycle === 'ANNUAL') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const subscription = await this.prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId: dto.planId,
        billingCycle: dto.billingCycle || 'MONTHLY',
        status: dto.status || 'ACTIVE',
        customSeatQuota: dto.customSeatQuota,
        customTechnicianQuota: dto.customTechnicianQuota,
        customBranchQuota: dto.customBranchQuota,
        additionalModules: dto.additionalModules || [],
        disabledModules: dto.disabledModules || [],
        currentPeriodStart,
        currentPeriodEnd,
      },
      create: {
        tenantId,
        planId: dto.planId,
        billingCycle: dto.billingCycle || 'MONTHLY',
        status: dto.status || 'ACTIVE',
        customSeatQuota: dto.customSeatQuota,
        customTechnicianQuota: dto.customTechnicianQuota,
        customBranchQuota: dto.customBranchQuota,
        additionalModules: dto.additionalModules || [],
        disabledModules: dto.disabledModules || [],
        currentPeriodStart,
        currentPeriodEnd,
      },
      include: {
        plan: true,
      },
    });

    return subscription;
  }
}
