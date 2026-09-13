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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const token_util_1 = require("../../core/shared/utils/token.util");
let CustomerService = class CustomerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCustomer(tenantId, createCustomerDto) {
        const customer = await this.prisma.customerRecord.create({
            data: {
                tenantId,
                name: createCustomerDto.name,
                email: createCustomerDto.email,
                phone: createCustomerDto.phone,
                address: createCustomerDto.address,
                city: createCustomerDto.city,
            },
        });
        return customer;
    }
    async inviteCustomer(tenantId, customerRecordId) {
        const customerRecord = await this.prisma.customerRecord.findUnique({
            where: { id: customerRecordId },
        });
        if (!customerRecord || customerRecord.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Customer record not found for this tenant');
        }
        let relationship = await this.prisma.customerTenantRelationship.findUnique({
            where: {
                tenantId_customerRecordId: {
                    tenantId,
                    customerRecordId,
                }
            }
        });
        if (!relationship) {
            relationship = await this.prisma.customerTenantRelationship.create({
                data: {
                    tenantId,
                    customerRecordId,
                    status: 'INVITATION_PENDING',
                }
            });
        }
        const plainToken = token_util_1.TokenUtil.generateSecureToken();
        const tokenHash = token_util_1.TokenUtil.hashToken(plainToken);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await this.prisma.invitation.create({
            data: {
                tokenHash,
                relationshipId: relationship.id,
                status: 'PENDING',
                expiresAt,
            }
        });
        return {
            message: 'Invitation generated successfully',
            plainToken,
            expiresAt,
        };
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map