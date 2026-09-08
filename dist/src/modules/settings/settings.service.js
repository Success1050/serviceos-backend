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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
let SettingsService = class SettingsService {
    prisma;
    auditLogService;
    constructor(prisma, auditLogService) {
        this.prisma = prisma;
        this.auditLogService = auditLogService;
    }
    async getSettings(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                settings: true,
                parent: {
                    include: { settings: true }
                }
            }
        });
        if (!tenant || !tenant.settings) {
            throw new common_1.NotFoundException('Settings not found for this tenant');
        }
        let resolvedSettings = { ...tenant.settings };
        let lockedFields = [];
        if (tenant.parent && tenant.parent.settings) {
            const parentSettings = tenant.parent.settings;
            lockedFields = Array.isArray(parentSettings.lockedSettings)
                ? parentSettings.lockedSettings
                : [];
            lockedFields.forEach((field) => {
                if (parentSettings[field] !== undefined) {
                    resolvedSettings[field] = parentSettings[field];
                }
            });
        }
        return { ...resolvedSettings, lockedByHQ: lockedFields };
    }
    async updateSettings(tenantId, userId, updateDto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true, parent: { include: { settings: true } } }
        });
        if (!tenant || !tenant.settings)
            throw new common_1.NotFoundException('Settings not found');
        if (tenant.parent && tenant.parent.settings) {
            const lockedFields = Array.isArray(tenant.parent.settings.lockedSettings)
                ? tenant.parent.settings.lockedSettings
                : [];
            const attemptedLockedUpdates = lockedFields.filter(field => updateDto[field] !== undefined);
            if (attemptedLockedUpdates.length > 0) {
                throw new common_1.ForbiddenException(`You cannot update the following settings because they are strictly managed by your HQ: ${attemptedLockedUpdates.join(', ')}`);
            }
        }
        const existing = tenant.settings;
        const updated = await this.prisma.tenantSettings.update({
            where: { tenantId },
            data: {
                businessProfile: (updateDto.businessProfile ? { ...(existing.businessProfile || {}), ...updateDto.businessProfile } : existing.businessProfile),
                branding: (updateDto.branding ? { ...(existing.branding || {}), ...updateDto.branding } : existing.branding),
                portal: (updateDto.portal ? { ...(existing.portal || {}), ...updateDto.portal } : existing.portal),
                quotes: (updateDto.quotes ? { ...(existing.quotes || {}), ...updateDto.quotes } : existing.quotes),
                invoices: (updateDto.invoices ? { ...(existing.invoices || {}), ...updateDto.invoices } : existing.invoices),
                payments: (updateDto.payments ? { ...(existing.payments || {}), ...updateDto.payments } : existing.payments),
                notifications: (updateDto.notifications ? { ...(existing.notifications || {}), ...updateDto.notifications } : existing.notifications),
                scheduling: (updateDto.scheduling ? { ...(existing.scheduling || {}), ...updateDto.scheduling } : existing.scheduling),
                technicians: (updateDto.technicians ? { ...(existing.technicians || {}), ...updateDto.technicians } : existing.technicians),
                lockedSettings: (updateDto.lockedSettings !== undefined ? updateDto.lockedSettings : existing.lockedSettings),
            },
        });
        await this.auditLogService.logAction(tenantId, userId, 'UPDATE_SETTINGS', 'TenantSettings', updated.id, { changes: updateDto });
        return updated;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map