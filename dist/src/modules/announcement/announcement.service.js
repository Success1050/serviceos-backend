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
exports.AnnouncementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let AnnouncementService = class AnnouncementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (tenant?.parentId) {
            throw new common_1.ForbiddenException('Only HQ can create announcements');
        }
        return this.prisma.announcement.create({
            data: {
                tenantId,
                title: dto.title,
                content: dto.content,
                priority: dto.priority || 'NORMAL',
                targetTenants: dto.targetTenants || [],
            },
        });
    }
    async findAllForTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant?.parentId) {
            return this.prisma.announcement.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
            });
        }
        return this.prisma.announcement.findMany({
            where: {
                tenantId: tenant.parentId,
                OR: [
                    { targetTenants: { equals: [] } },
                    { targetTenants: { has: tenantId } }
                ]
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.AnnouncementService = AnnouncementService;
exports.AnnouncementService = AnnouncementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnouncementService);
//# sourceMappingURL=announcement.service.js.map