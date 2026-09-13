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
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const execute_import_dto_1 = require("./dto/execute-import.dto");
let ImportService = class ImportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    analyzeColumns(analyzeDto) {
        const { rows } = analyzeDto;
        if (rows.length === 0)
            throw new common_1.BadRequestException('No rows provided');
        const headers = Object.keys(rows[0]);
        const mapping = {};
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
                    break;
                }
            }
        }
        return {
            headers,
            suggestedMapping: mapping,
            rowCount: rows.length
        };
    }
    normalizePhone(phone) {
        if (!phone)
            return null;
        let normalized = String(phone).trim().replace(/\D/g, '');
        if (normalized.startsWith('234') && normalized.length === 13) {
            return '+' + normalized;
        }
        if (normalized.startsWith('0') && normalized.length === 11) {
            return '+234' + normalized.substring(1);
        }
        const originalString = String(phone).trim();
        if (originalString.startsWith('+')) {
            return '+' + normalized;
        }
        return normalized;
    }
    async previewImport(tenantId, previewDto) {
        const { rows, mapping } = previewDto;
        const valid = [];
        const invalid = [];
        const duplicates = [];
        const existingCustomers = await this.prisma.customerRecord.findMany({
            where: { tenantId },
            select: { id: true, name: true, phone: true, email: true }
        });
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const parsedRecord = { _rowIndex: i + 1 };
            for (const [csvHeader, sysField] of Object.entries(mapping)) {
                parsedRecord[sysField] = row[csvHeader];
            }
            parsedRecord.phone = this.normalizePhone(parsedRecord.phone);
            if (parsedRecord.email) {
                parsedRecord.email = String(parsedRecord.email).toLowerCase().trim();
            }
            if (!parsedRecord.name) {
                invalid.push({ ...parsedRecord, _error: 'Missing name' });
                continue;
            }
            if (!parsedRecord.phone && !parsedRecord.email) {
                invalid.push({ ...parsedRecord, _error: 'Missing contact info (phone or email required)' });
                continue;
            }
            const isDuplicate = existingCustomers.find(c => (parsedRecord.phone && c.phone === parsedRecord.phone) ||
                (parsedRecord.email && c.email === parsedRecord.email) ||
                (c.name === parsedRecord.name && (c.phone === parsedRecord.phone || c.email === parsedRecord.email)));
            if (isDuplicate) {
                duplicates.push({
                    imported: parsedRecord,
                    existing: isDuplicate,
                    _reason: 'Phone or Email matched an existing record'
                });
            }
            else {
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
    async executeImport(tenantId, executeDto) {
        const { rows, mapping, duplicateRule } = executeDto;
        const previewResult = await this.previewImport(tenantId, { rows, mapping });
        const recordsToCreate = [];
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
        let updatedCount = 0;
        if (duplicateRule === execute_import_dto_1.DuplicateRule.CREATE_NEW) {
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
        }
        else if (duplicateRule === execute_import_dto_1.DuplicateRule.UPDATE) {
            const updatePromises = previewResult.duplicates.map(dup => this.prisma.customerRecord.update({
                where: { id: dup.existing.id },
                data: {
                    name: dup.imported.name || dup.existing.name,
                    email: dup.imported.email || dup.existing.email,
                    phone: dup.imported.phone || dup.existing.phone,
                    address: dup.imported.address || undefined,
                    city: dup.imported.city || undefined,
                }
            }));
            await this.prisma.$transaction(updatePromises);
            updatedCount = updatePromises.length;
        }
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
            skipped: duplicateRule === execute_import_dto_1.DuplicateRule.SKIP ? previewResult.duplicates.length : 0,
            invalid: previewResult.invalid.length,
        };
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportService);
//# sourceMappingURL=import.service.js.map