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
exports.JobController = void 0;
const common_1 = require("@nestjs/common");
const job_service_1 = require("./job.service");
const create_job_dto_1 = require("./dto/create-job.dto");
const update_job_status_dto_1 = require("./dto/update-job-status.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let JobController = class JobController {
    jobService;
    constructor(jobService) {
        this.jobService = jobService;
    }
    async create(user, createJobDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.jobService.createJob(user.tenantId, createJobDto);
    }
    async findAll(user) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.jobService.getJobs(user.tenantId, user);
    }
    async updateStatus(user, jobId, updateDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.jobService.updateJobStatus(user.tenantId, jobId, updateDto, user);
    }
};
exports.JobController = JobController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_job_dto_1.CreateJobDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_job_status_dto_1.UpdateJobStatusDto]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "updateStatus", null);
exports.JobController = JobController = __decorate([
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [job_service_1.JobService])
], JobController);
//# sourceMappingURL=job.controller.js.map