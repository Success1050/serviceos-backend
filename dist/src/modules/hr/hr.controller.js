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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const hr_service_1 = require("./hr.service");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const create_over_the_desk_tech_dto_1 = require("./dto/create-over-the-desk-tech.dto");
const upload_hr_document_dto_1 = require("./dto/upload-hr-document.dto");
const review_proxy_verification_dto_1 = require("./dto/review-proxy-verification.dto");
const filter_technicians_dto_1 = require("./dto/filter-technicians.dto");
const acknowledge_terms_dto_1 = require("./dto/acknowledge-terms.dto");
let HrController = class HrController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    async createOverTheDeskTech(user, dto) {
        return this.hrService.createOverTheDeskTech(user, dto);
    }
    async uploadHrDocument(user, techId, dto) {
        return this.hrService.uploadHrDocument(user, techId, dto);
    }
    async getTechnicianDossier(user, techId) {
        return this.hrService.getTechnicianDossier(user, techId);
    }
    async listBranchTechnicians(user, filter) {
        return this.hrService.listBranchTechnicians(user, filter);
    }
    async getPendingProxyVerifications(user) {
        return this.hrService.getPendingProxyVerifications(user);
    }
    async reviewProxyVerification(user, techId, dto) {
        return this.hrService.reviewProxyVerification(user, techId, dto);
    }
    async acknowledgeTerms(user, dto, ip, userAgent) {
        const clientIp = ip || '127.0.0.1';
        const clientUa = userAgent || 'Mobile Field Web App';
        return this.hrService.acknowledgeTerms(user, dto, clientIp, clientUa);
    }
    async getMyCompensation(user) {
        return this.hrService.getMyCompensation(user);
    }
};
exports.HrController = HrController;
__decorate([
    (0, common_1.Post)('technicians/over-the-desk'),
    (0, permissions_decorator_1.Permissions)('manage_branch_technicians', 'manage_staff', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_over_the_desk_tech_dto_1.CreateOverTheDeskTechDto]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "createOverTheDeskTech", null);
__decorate([
    (0, common_1.Post)('technicians/:id/documents'),
    (0, permissions_decorator_1.Permissions)('manage_branch_technicians', 'manage_staff', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_hr_document_dto_1.UploadHrDocumentDto]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "uploadHrDocument", null);
__decorate([
    (0, common_1.Get)('technicians/:id/dossier'),
    (0, permissions_decorator_1.Permissions)('view_technician_hr_records', 'manage_branch_technicians', 'manage_staff', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getTechnicianDossier", null);
__decorate([
    (0, common_1.Get)('technicians'),
    (0, permissions_decorator_1.Permissions)('view_technician_hr_records', 'manage_branch_technicians', 'manage_staff', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filter_technicians_dto_1.FilterTechniciansDto]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "listBranchTechnicians", null);
__decorate([
    (0, common_1.Get)('hq/verifications/pending'),
    (0, permissions_decorator_1.Permissions)('verify_technician_hires', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getPendingProxyVerifications", null);
__decorate([
    (0, common_1.Post)('hq/verifications/:id/review'),
    (0, permissions_decorator_1.Permissions)('verify_technician_hires', 'admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, review_proxy_verification_dto_1.ReviewProxyVerificationDto]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "reviewProxyVerification", null);
__decorate([
    (0, common_1.Post)('technicians/me/acknowledge-terms'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __param(3, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, acknowledge_terms_dto_1.AcknowledgeTermsDto, String, String]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "acknowledgeTerms", null);
__decorate([
    (0, common_1.Get)('technicians/me/compensation'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HrController.prototype, "getMyCompensation", null);
exports.HrController = HrController = __decorate([
    (0, common_1.Controller)('hr'),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map