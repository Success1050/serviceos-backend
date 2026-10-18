import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto, DuplicateRule } from './dto/execute-import.dto';
import { TokenUtil } from '../../core/shared/utils/token.util';

@Injectable()
export class ImportService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('customer-import-queue') private readonly importQueue: Queue,
  ) {}

  // 1. Analyze and guess columns
  analyzeColumns(analyzeDto: AnalyzeImportDto) {
    const { rows } = analyzeDto;
    if (rows.length === 0) throw new BadRequestException('No rows provided');

    const headers = Object.keys(rows[0]);
    const mapping: Record<string, string> = {};

    for (const header of headers) {
      const normalized = header.toLowerCase().trim();

      // Explicit priority safeguards to prevent substring collisions (e.g., 'email address' vs 'address')
      if (
        normalized.includes('email') ||
        normalized.includes('e-mail') ||
        normalized === 'mail'
      ) {
        mapping[header] = 'email';
      } else if (
        normalized.includes('phone') ||
        normalized.includes('mobile') ||
        normalized.includes('telephone') ||
        normalized.includes('tel') ||
        normalized.includes('contact no')
      ) {
        mapping[header] = 'phone';
      } else if (
        normalized.includes('name') ||
        normalized.includes('client') ||
        normalized.includes('customer') ||
        normalized.includes('business') ||
        normalized.includes('contact person')
      ) {
        mapping[header] = 'name';
      } else if (
        normalized.includes('address') ||
        normalized.includes('street') ||
        normalized.includes('site') ||
        normalized.includes('location')
      ) {
        mapping[header] = 'address';
      } else if (
        normalized.includes('city') ||
        normalized.includes('town') ||
        normalized.includes('state') ||
        normalized.includes('region') ||
        normalized.includes('lga')
      ) {
        mapping[header] = 'city';
      }
    }

    return {
      headers,
      suggestedMapping: mapping,
      rowCount: rows.length,
    };
  }

  // Official sample customer template rows supported by the backend
  getSampleTemplateRows() {
    return [
      {
        'Customer Name': 'Chief Adeleke Solarin',
        'Phone Number': '08031234567',
        'Email Address': 'adeleke@sunshinesolar.ng',
        'Installation Address': 'Plot 14 Admiralty Way Lekki Phase 1',
        'City': 'Lagos',
      },
      {
        'Customer Name': 'Dr. Ngozi Okonjo',
        'Phone Number': '08029876543',
        'Email Address': 'ngozi.okonjo@horizonenergy.org',
        'Installation Address': '12 Maitama Crescent',
        'City': 'Abuja',
      },
      {
        'Customer Name': 'Green Valley Estate Facility Office',
        'Phone Number': '08105556677',
        'Email Address': 'operations@greenvalley.ng',
        'Installation Address': 'Km 42 Lekki-Epe Expressway',
        'City': 'Lagos',
      },
      {
        'Customer Name': 'Kano Renewable Cold Storage Ltd',
        'Phone Number': '08098765432',
        'Email Address': 'procurement@kanocold.com',
        'Installation Address': '8 Bompai Industrial Area',
        'City': 'Kano',
      },
      {
        'Customer Name': 'Babatunde Fashola Homes',
        'Phone Number': '08123456789',
        'Email Address': 'babatunde@fasholahomes.ng',
        'Installation Address': '25 Isaac John Street GRA Ikeja',
        'City': 'Lagos',
      },
    ];
  }

  // Canonical CSV template formatted for download
  getSampleCsvTemplate(): string {
    const rows = this.getSampleTemplateRows();
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h as keyof typeof row] || '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ];
    return lines.join('\r\n');
  }

  // 2. Helper to normalize phone numbers (specifically handling Nigerian formats + Excel trimmed leading zero)
  private normalizePhone(phone: string | number | undefined | null): string | null {
    if (!phone) return null;
    let normalized = String(phone).trim().replace(/\D/g, ''); // remove non-digits

    // Nigerian normalization
    if (normalized.startsWith('234') && normalized.length === 13) {
      return '+' + normalized;
    }
    if (normalized.startsWith('0') && normalized.length === 11) {
      return '+234' + normalized.substring(1);
    }
    // Handle 10-digit Nigerian number where spreadsheet/Excel stripped the leading 0 (e.g., 8031234567)
    if (normalized.length === 10 && /^[789]/.test(normalized)) {
      return '+234' + normalized;
    }
    
    // If it's already got a +, just return it cleaned
    const originalString = String(phone).trim();
    if (originalString.startsWith('+')) {
      return '+' + normalized;
    }

    return normalized;
  }

  // 3. Preview Import (Duplicate Detection & Validation)
  async previewImport(tenantId: string, previewDto: PreviewImportDto) {
    const { rows, mapping } = previewDto;
    
    const valid: any[] = [];
    const invalid: any[] = [];
    const duplicates: any[] = [];

    // Fetch existing customers for this tenant to check duplicates
    const existingCustomers = await this.prisma.customerRecord.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, email: true }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsedRecord: any = { _rowIndex: i + 1 };
      
      // Map columns
      for (const [csvHeader, sysField] of Object.entries(mapping)) {
        parsedRecord[sysField] = row[csvHeader];
      }

      parsedRecord.phone = this.normalizePhone(parsedRecord.phone);
      
      if (parsedRecord.email) {
        parsedRecord.email = String(parsedRecord.email).toLowerCase().trim();
      }

      // Basic validation
      if (!parsedRecord.name) {
        invalid.push({ ...parsedRecord, _error: 'Missing name' });
        continue;
      }
      if (!parsedRecord.phone && !parsedRecord.email) {
        invalid.push({ ...parsedRecord, _error: 'Missing contact info (phone or email required)' });
        continue;
      }

      // Duplicate detection (normalized phone & case-insensitive email matching)
      const isDuplicate = existingCustomers.find((c) => {
        const cPhoneNorm = this.normalizePhone(c.phone);
        const cEmailLower = c.email?.toLowerCase().trim();
        const phoneMatch = Boolean(
          parsedRecord.phone && (c.phone === parsedRecord.phone || cPhoneNorm === parsedRecord.phone),
        );
        const emailMatch = Boolean(parsedRecord.email && cEmailLower === parsedRecord.email);
        const nameMatch = Boolean(
          parsedRecord.name && c.name?.toLowerCase().trim() === parsedRecord.name?.toLowerCase().trim(),
        );
        return phoneMatch || emailMatch || (nameMatch && (phoneMatch || emailMatch));
      });

      if (isDuplicate) {
        duplicates.push({ 
          imported: parsedRecord, 
          existing: isDuplicate, 
          _reason: 'Phone or Email matched an existing record' 
        });
      } else {
        valid.push(parsedRecord);
      }
    }

    return {
      metrics: {
        totalProcessed: rows.length,
        validCount: valid.length,
        duplicateCount: duplicates.length,
        invalidCount: invalid.length,
      },
      valid,
      duplicates,
      invalid
    };
  }

  // 4. Execute Import
  async executeImport(tenantId: string, executeDto: ExecuteImportDto) {
    const { rows, mapping, duplicateRule, activationChoice = 'ALL' } = executeDto;
    
    // We run preview again to resolve valid vs duplicate vs invalid
    const previewResult = await this.previewImport(tenantId, { rows, mapping });
    
    const recordsToCreate: any[] = [];

    // 1. All valid records will be created
    for (const record of previewResult.valid) {
      recordsToCreate.push({
        tenantId,
        name: record.name,
        email: record.email || null,
        phone: record.phone || null,
        address: record.address || null,
        city: record.city || null,
      });
    }

    // 2. Handle duplicates based on rule
    let updatedCount = 0;
    
    if (duplicateRule === DuplicateRule.CREATE_NEW) {
      for (const dup of previewResult.duplicates) {
        const record = dup.imported;
        recordsToCreate.push({
          tenantId,
          name: record.name,
          email: record.email || null,
          phone: record.phone || null,
          address: record.address || null,
          city: record.city || null,
        });
      }
    } else if (duplicateRule === DuplicateRule.UPDATE) {
      // Use transaction to update
      const updatePromises = previewResult.duplicates.map(dup => 
        this.prisma.customerRecord.update({
          where: { id: dup.existing.id },
          data: {
            name: dup.imported.name || dup.existing.name,
            email: dup.imported.email || dup.existing.email,
            phone: dup.imported.phone || dup.existing.phone,
            address: dup.imported.address || undefined,
            city: dup.imported.city || undefined,
          }
        })
      );
      await this.prisma.$transaction(updatePromises);
      updatedCount = updatePromises.length;
    }
    // If SKIP, we do nothing with duplicates.

    // 3. Bulk insert creations
    let createdCount = 0;
    const createdCustomerIds: string[] = [];
    if (recordsToCreate.length > 0) {
      const createResult = await this.prisma.customerRecord.createManyAndReturn({
        data: recordsToCreate,
        select: { id: true, phone: true },
      });
      createdCount = createResult.length;
      for (const item of createResult) {
        if (
          activationChoice === 'ALL' ||
          (activationChoice === 'PHONE_ONLY' && item.phone)
        ) {
          createdCustomerIds.push(item.id);
        }
      }
    }

    // 4. Batch Portal Invitation Generation if requested
    let invitedCount = 0;
    if (createdCustomerIds.length > 0 && activationChoice !== 'NONE') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      for (const customerRecordId of createdCustomerIds) {
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
        invitedCount++;
      }
    }

    return {
      message: 'Import completed successfully',
      created: createdCount,
      updated: updatedCount,
      skipped: duplicateRule === DuplicateRule.SKIP ? previewResult.duplicates.length : 0,
      invalid: previewResult.invalid.length,
      invited: invitedCount,
    };
  }

  // 5. Enqueue Large Import as Background Bull Job
  async queueImport(
    tenantId: string,
    executeDto: ExecuteImportDto,
    activationChoice: 'ALL' | 'PHONE_ONLY' | 'NONE' = 'ALL',
  ) {
    const job = await this.importQueue.add(
      'process-customer-import',
      {
        tenantId,
        rows: executeDto.rows,
        mapping: executeDto.mapping,
        duplicateRule: executeDto.duplicateRule,
        activationChoice,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    return {
      jobId: String(job.id),
      status: 'QUEUED',
      message: `Enqueued ${executeDto.rows.length} customer records for background processing.`,
    };
  }

  // 6. Check Background Job Status & Progress
  async getJobStatus(jobId: string) {
    const job = await this.importQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Background job #${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;
    const returnvalue = job.returnvalue;

    return {
      jobId: String(job.id),
      state, // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
      progress: typeof progress === 'number' ? progress : 0,
      failedReason,
      result: returnvalue || null,
    };
  }

  // 7. Enqueue Bulk Customer Invitations
  async queueBatchInvitations(tenantId: string, customerIds: string[]) {
    const job = await this.importQueue.add(
      'dispatch-batch-invitations',
      { tenantId, customerIds },
      { attempts: 2, removeOnComplete: 100 },
    );

    return {
      jobId: String(job.id),
      status: 'QUEUED',
      message: `Enqueued portal invitations for ${customerIds.length} customers.`,
    };
  }
}

