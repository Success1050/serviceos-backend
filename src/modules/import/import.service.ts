import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AnalyzeImportDto } from './dto/analyze-import.dto';
import { PreviewImportDto } from './dto/preview-import.dto';
import { ExecuteImportDto, DuplicateRule } from './dto/execute-import.dto';

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

    const dictionary = {
      name: ['name', 'customer name', 'full name', 'client name'],
      email: ['email', 'email address', 'e-mail'],
      phone: ['phone', 'phone number', 'mobile', 'telephone', 'mobile no.'],
      address: ['address', 'house address', 'street'],
      city: ['city', 'town']
    };

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      for (const [sysField, variations] of Object.entries(dictionary)) {
        if (variations.some(v => normalizedHeader.includes(v))) {
          mapping[header] = sysField;
          break; // move to next header
        }
      }
    }

    return {
      headers,
      suggestedMapping: mapping,
      rowCount: rows.length
    };
  }

  // 2. Helper to normalize phone numbers (specifically handling Nigerian formats)
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

      // Duplicate detection
      const isDuplicate = existingCustomers.find(c => 
        (parsedRecord.phone && c.phone === parsedRecord.phone) || 
        (parsedRecord.email && c.email === parsedRecord.email) ||
        (c.name === parsedRecord.name && (c.phone === parsedRecord.phone || c.email === parsedRecord.email))
      );

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
    const { rows, mapping, duplicateRule } = executeDto;
    
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
    if (recordsToCreate.length > 0) {
      const createResult = await this.prisma.customerRecord.createMany({
        data: recordsToCreate,
      });
      createdCount = createResult.count;
    }

    return {
      message: 'Import completed successfully',
      created: createdCount,
      updated: updatedCount,
      skipped: duplicateRule === DuplicateRule.SKIP ? previewResult.duplicates.length : 0,
      invalid: previewResult.invalid.length,
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

