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
exports.MaintenanceProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const maintenance_service_1 = require("../maintenance.service");
let MaintenanceProcessor = class MaintenanceProcessor {
    maintenanceService;
    constructor(maintenanceService) {
        this.maintenanceService = maintenanceService;
    }
    async handleGenerateJobs(job) {
        console.log(`[Bull] Processing generate-due-jobs...`);
        const result = await this.maintenanceService.generateJobsForDueSchedules();
        console.log(`[Bull] Completed generate-due-jobs. Generated ${result.processed} jobs.`);
        return result;
    }
};
exports.MaintenanceProcessor = MaintenanceProcessor;
__decorate([
    (0, bull_1.Process)('generate-due-jobs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceProcessor.prototype, "handleGenerateJobs", null);
exports.MaintenanceProcessor = MaintenanceProcessor = __decorate([
    (0, bull_1.Processor)('maintenance-queue'),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceProcessor);
//# sourceMappingURL=maintenance.processor.js.map