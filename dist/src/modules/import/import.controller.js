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
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const import_service_1 = require("./import.service");
const analyze_import_dto_1 = require("./dto/analyze-import.dto");
const preview_import_dto_1 = require("./dto/preview-import.dto");
const execute_import_dto_1 = require("./dto/execute-import.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
let ImportController = class ImportController {
    importService;
    constructor(importService) {
        this.importService = importService;
    }
    analyze(analyzeDto) {
        return this.importService.analyzeColumns(analyzeDto);
    }
    async preview(user, previewDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.importService.previewImport(user.tenantId, previewDto);
    }
    async execute(user, executeDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.importService.executeImport(user.tenantId, executeDto);
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, common_1.Post)('analyze'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analyze_import_dto_1.AnalyzeImportDto]),
    __metadata("design:returntype", void 0)
], ImportController.prototype, "analyze", null);
__decorate([
    (0, common_1.Post)('preview'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, preview_import_dto_1.PreviewImportDto]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('execute'),
    (0, permissions_decorator_1.Permissions)('admin_access'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, execute_import_dto_1.ExecuteImportDto]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "execute", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map