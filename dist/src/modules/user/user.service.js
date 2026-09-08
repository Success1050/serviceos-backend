"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mail_service_1 = require("../../core/mail/mail.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let UserService = class UserService {
    prisma;
    mailService;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async createStaff(dto, currentUser) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id: currentUser.tenantId } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const isSubCompany = !!tenant.parentId;
        const initialStatus = isSubCompany ? 'PENDING_APPROVAL' : 'ACTIVE';
        const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                firstName: dto.firstName,
                lastName: dto.lastName,
                passwordHash: dummyHash,
                role: dto.role,
                departmentId: dto.departmentId || null,
                tenantId: tenant.id,
                status: initialStatus,
                requiresPasswordReset: initialStatus === 'ACTIVE',
            },
        });
        if (initialStatus === 'ACTIVE') {
            await this.processApprovalAndSendEmail(user.id, tenant);
        }
        return { message: 'Staff member created successfully', status: initialStatus };
    }
    async getPendingStaff(currentUser) {
        return this.prisma.user.findMany({
            where: {
                status: 'PENDING_APPROVAL',
                tenant: {
                    parentId: currentUser.tenantId,
                },
            },
            include: {
                tenant: { select: { name: true } },
                department: { select: { name: true } },
            }
        });
    }
    async approveStaff(userId, currentUser) {
        const userToApprove = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });
        if (!userToApprove)
            throw new common_1.NotFoundException('User not found');
        if (userToApprove.tenant && userToApprove.tenant.parentId !== currentUser.tenantId) {
            throw new common_1.ForbiddenException('You can only approve staff for your own sub-companies');
        }
        if (userToApprove.status !== 'PENDING_APPROVAL') {
            throw new common_1.ForbiddenException('User is not pending approval');
        }
        const { tempPassword } = await this.processApprovalAndSendEmail(userId, userToApprove.tenant);
        return {
            message: 'Staff approved successfully',
            tempPassword
        };
    }
    async processApprovalAndSendEmail(userId, tenant) {
        const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: 'ACTIVE',
                requiresPasswordReset: true,
                passwordHash,
            },
        });
        await this.mailService.sendStaffTemporaryPassword(user.email, user.firstName, tempPassword, tenant.name);
        return { tempPassword };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], UserService);
//# sourceMappingURL=user.service.js.map