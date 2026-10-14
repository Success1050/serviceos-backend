import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { TokenUtil } from '../../../core/shared/utils/token.util';
import { DuplicateRule } from '../dto/execute-import.dto';

export interface CustomerImportJobData {
  tenantId: string;
  rows: Record<string, any>[];
  mapping: Record<string, string>;
  duplicateRule: DuplicateRule;
  activationChoice?: 'ALL' | 'PHONE_ONLY' | 'NONE';
}

export interface BatchInviteJobData {
  tenantId: string;
  customerIds: string[];
}

@Processor('customer-import-queue')
export class CustomerImportProcessor {
  constructor(private readonly prisma: PrismaService) {}

  @Process('process-customer-import')
  async handleCustomerImport(job: Job<CustomerImportJobData>) {
    const { tenantId, rows, mapping, duplicateRule, activationChoice = 'ALL' } = job.data;
    console.log(`[Bull] Starting customer-import-queue job #${job.id} for tenant: ${tenantId} (${rows.length} rows)`);

    const CHUNK_SIZE = 250;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalInvalid = 0;
    let totalInvited = 0;

    await job.progress(5);

    // 1. Fetch existing customers for deduplication
    const existing = await this.prisma.customerRecord.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, email: true },
    });

    const existingPhoneMap = new Map<string, string>();
    const existingEmailMap = new Map<string, string>();

    for (const c of existing) {
      if (c.phone) existingPhoneMap.set(c.phone, c.id);
      if (c.email) existingEmailMap.set(c.email.toLowerCase(), c.id);
    }

    await job.progress(15);

    // 2. Process records in chunks
    const validRecordsToInsert: any[] = [];
    const recordsToUpdate: Array<{ id: string; data: any }> = [];

    const totalRows = rows.length;
    for (let i = 0; i < totalRows; i++) {
      const row = rows[i];
      const parsed: any = {};

      for (const [csvHdr, sysField] of Object.entries(mapping)) {
        parsed[sysField] = row[csvHdr];
      }

      if (parsed.name) parsed.name = String(parsed.name).trim();
      if (parsed.email) parsed.email = String(parsed.email).toLowerCase().trim();
      if (parsed.phone) {
        let p = String(parsed.phone).trim().replace(/\D/g, '');
        if (p.startsWith('234') && p.length === 13) p = '+' + p;
        else if (p.startsWith('0') && p.length === 11) p = '+234' + p.substring(1);
        else if (String(parsed.phone).startsWith('+')) p = '+' + p;
        parsed.phone = p;
      }

      if (!parsed.name || (!parsed.phone && !parsed.email)) {
        totalInvalid++;
        continue;
      }

      const matchId =
        (parsed.phone && existingPhoneMap.get(parsed.phone)) ||
        (parsed.email && existingEmailMap.get(parsed.email));

      if (matchId) {
        if (duplicateRule === DuplicateRule.SKIP) {
          totalSkipped++;
        } else if (duplicateRule === DuplicateRule.UPDATE) {
          recordsToUpdate.push({ id: matchId, data: parsed });
        } else {
          validRecordsToInsert.push({ tenantId, ...parsed });
        }
      } else {
        validRecordsToInsert.push({ tenantId, ...parsed });
        // Add to local cache to prevent duplicates within the file itself
        if (parsed.phone) existingPhoneMap.set(parsed.phone, 'new');
        if (parsed.email) existingEmailMap.set(parsed.email, 'new');
      }

      // Update progress every 500 rows
      if (i % 500 === 0 && totalRows > 0) {
        const pct = 15 + Math.round((i / totalRows) * 45);
        await job.progress(pct);
      }
    }

    await job.progress(60);

    // 3. Batch Inserts in CHUNK_SIZE blocks
    const createdCustomerIds: string[] = [];
    for (let i = 0; i < validRecordsToInsert.length; i += CHUNK_SIZE) {
      const chunk = validRecordsToInsert.slice(i, i + CHUNK_SIZE);
      const res = await this.prisma.customerRecord.createManyAndReturn({
        data: chunk.map((c) => ({
          tenantId: c.tenantId,
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          address: c.address || null,
          city: c.city || null,
        })),
        select: { id: true, phone: true, email: true },
      });
      totalCreated += res.length;
      for (const item of res) {
        if (
          activationChoice === 'ALL' ||
          (activationChoice === 'PHONE_ONLY' && item.phone)
        ) {
          createdCustomerIds.push(item.id);
        }
      }

      const insertPct =
        60 + Math.round(((i + chunk.length) / validRecordsToInsert.length) * 20);
      await job.progress(insertPct);
    }

    // 4. Batch Updates
    for (const item of recordsToUpdate) {
      await this.prisma.customerRecord.update({
        where: { id: item.id },
        data: {
          name: item.data.name,
          email: item.data.email || undefined,
          phone: item.data.phone || undefined,
          address: item.data.address || undefined,
          city: item.data.city || undefined,
        },
      });
      totalUpdated++;
    }

    await job.progress(85);

    // 5. Batch Portal Invitation Generation if requested
    if (createdCustomerIds.length > 0 && activationChoice !== 'NONE') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      for (let i = 0; i < createdCustomerIds.length; i += CHUNK_SIZE) {
        const chunk = createdCustomerIds.slice(i, i + CHUNK_SIZE);

        for (const customerRecordId of chunk) {
          let relationship = await this.prisma.customerTenantRelationship.findUnique({
            where: {
              tenantId_customerRecordId: { tenantId, customerRecordId },
            },
          });

          if (!relationship) {
            relationship = await this.prisma.customerTenantRelationship.create({
              data: {
                tenantId,
                customerRecordId,
                status: 'INVITATION_PENDING',
              },
            });
          }

          const plainToken = TokenUtil.generateSecureToken();
          const tokenHash = TokenUtil.hashToken(plainToken);

          await this.prisma.invitation.create({
            data: {
              tokenHash,
              relationshipId: relationship.id,
              status: 'PENDING',
              expiresAt,
            },
          });
          totalInvited++;
        }

        const invitePct =
          85 + Math.round(((i + chunk.length) / createdCustomerIds.length) * 14);
        await job.progress(invitePct);
      }
    }

    await job.progress(100);

    const summary = {
      message: 'Background customer import completed successfully',
      created: totalCreated,
      updated: totalUpdated,
      skipped: totalSkipped,
      invalid: totalInvalid,
      invited: totalInvited,
    };

    console.log(`[Bull] Completed customer-import-queue job #${job.id}:`, summary);
    return summary;
  }

  @Process('dispatch-batch-invitations')
  async handleBatchInvitations(job: Job<BatchInviteJobData>) {
    const { tenantId, customerIds } = job.data;
    console.log(`[Bull] Starting batch-invitations job #${job.id} for ${customerIds.length} customers`);

    let successCount = 0;
    let failureCount = 0;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    for (let i = 0; i < customerIds.length; i++) {
      const customerRecordId = customerIds[i];
      try {
        let relationship = await this.prisma.customerTenantRelationship.findUnique({
          where: { tenantId_customerRecordId: { tenantId, customerRecordId } },
        });

        if (!relationship) {
          relationship = await this.prisma.customerTenantRelationship.create({
            data: {
              tenantId,
              customerRecordId,
              status: 'INVITATION_PENDING',
            },
          });
        }

        const plainToken = TokenUtil.generateSecureToken();
        const tokenHash = TokenUtil.hashToken(plainToken);

        await this.prisma.invitation.create({
          data: {
            tokenHash,
            relationshipId: relationship.id,
            status: 'PENDING',
            expiresAt,
          },
        });
        successCount++;
      } catch (err) {
        failureCount++;
      }

      if (i % 25 === 0) {
        await job.progress(Math.round(((i + 1) / customerIds.length) * 100));
      }
    }

    await job.progress(100);
    return { successCount, failureCount };
  }
}
