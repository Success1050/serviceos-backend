import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getSettings(tenantId: string) {
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
      throw new NotFoundException('Settings not found for this tenant');
    }

    let resolvedSettings = { ...tenant.settings };
    let lockedFields: string[] = [];

    // Hierarchy Fallback / Override Logic
    if (tenant.parent && tenant.parent.settings) {
      const parentSettings = tenant.parent.settings;
      lockedFields = Array.isArray(parentSettings.lockedSettings) 
        ? (parentSettings.lockedSettings as any as string[]) 
        : [];

      // For every locked field specified by the HQ, overwrite the child's setting
      lockedFields.forEach((field: string) => {
        if (parentSettings[field as keyof typeof parentSettings] !== undefined) {
          (resolvedSettings as any)[field] = parentSettings[field as keyof typeof parentSettings];
        }
      });
    }

    // Attach lockedByHQ so the frontend knows which UI forms to completely hide/disable
    return { ...resolvedSettings, lockedByHQ: lockedFields };
  }

  async updateSettings(tenantId: string, userId: string, updateDto: UpdateSettingsDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true, parent: { include: { settings: true } } }
    });

    if (!tenant || !tenant.settings) throw new NotFoundException('Settings not found');

    // Block the Sub-Company from even attempting to save locked fields
    if (tenant.parent && tenant.parent.settings) {
      const lockedFields = Array.isArray(tenant.parent.settings.lockedSettings)
        ? (tenant.parent.settings.lockedSettings as any as string[])
        : [];

      const attemptedLockedUpdates = lockedFields.filter(field => 
        (updateDto as any)[field as string] !== undefined
      );

      if (attemptedLockedUpdates.length > 0) {
        throw new ForbiddenException(
          `You cannot update the following settings because they are strictly managed by your HQ: ${attemptedLockedUpdates.join(', ')}`
        );
      }
    }

    const existing = tenant.settings;

    // Merge existing JSON fields with new updates to avoid overwriting entirely if only partial keys sent
    const updated = await this.prisma.tenantSettings.update({
      where: { tenantId },
      data: {
        businessProfile: (updateDto.businessProfile ? { ...(existing.businessProfile as object || {}), ...updateDto.businessProfile } : existing.businessProfile) as any,
        branding: (updateDto.branding ? { ...(existing.branding as object || {}), ...updateDto.branding } : existing.branding) as any,
        portal: (updateDto.portal ? { ...(existing.portal as object || {}), ...updateDto.portal } : existing.portal) as any,
        quotes: (updateDto.quotes ? { ...(existing.quotes as object || {}), ...updateDto.quotes } : existing.quotes) as any,
        invoices: (updateDto.invoices ? { ...(existing.invoices as object || {}), ...updateDto.invoices } : existing.invoices) as any,
        payments: (updateDto.payments ? { ...(existing.payments as object || {}), ...updateDto.payments } : existing.payments) as any,
        notifications: (updateDto.notifications ? { ...(existing.notifications as object || {}), ...updateDto.notifications } : existing.notifications) as any,
        scheduling: (updateDto.scheduling ? { ...(existing.scheduling as object || {}), ...updateDto.scheduling } : existing.scheduling) as any,
        technicians: (updateDto.technicians ? { ...(existing.technicians as object || {}), ...updateDto.technicians } : existing.technicians) as any,
        lockedSettings: (updateDto.lockedSettings !== undefined ? updateDto.lockedSettings : existing.lockedSettings) as any,
      },
    });

    // Write to audit log securely
    await this.auditLogService.logAction(
      tenantId,
      userId,
      'UPDATE_SETTINGS',
      'TenantSettings',
      updated.id,
      { changes: updateDto },
    );

    return updated;
  }
}
