"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTenant(createTenantDto, ownerId) {
        const existing = await this.prisma.tenant.findUnique({
            where: { slug: createTenantDto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Tenant slug is already taken');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Owner user not found');
        }
        if (user.tenantId) {
            throw new common_1.ConflictException('User already belongs to a tenant');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: createTenantDto.name,
                    slug: createTenantDto.slug,
                    settings: {
                        create: {
                            businessProfile: { companyName: createTenantDto.name },
                            branding: {},
                            portal: { enabled: true, welcomeMessage: `Welcome to ${createTenantDto.name}` },
                        },
                    },
                },
                include: {
                    settings: true,
                },
            });
            await tx.user.update({
                where: { id: user.id },
                data: {
                    tenantId: tenant.id,
                    role: 'TENANT_OWNER',
                },
            });
            return tenant;
        });
        return result;
    }
    async getTenantBySlug(slug) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            include: {
                settings: true,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map