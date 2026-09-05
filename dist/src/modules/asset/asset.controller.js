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
exports.AssetController = void 0;
const common_1 = require("@nestjs/common");
const asset_service_1 = require("./asset.service");
const create_asset_dto_1 = require("./dto/create-asset.dto");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AssetController = class AssetController {
    assetService;
    constructor(assetService) {
        this.assetService = assetService;
    }
    async create(user, createAssetDto) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.assetService.createAsset(user.tenantId, createAssetDto);
    }
    async findAll(user) {
        if (!user.tenantId)
            throw new common_1.BadRequestException('User does not belong to a tenant');
        return this.assetService.getAssets(user.tenantId);
    }
};
exports.AssetController = AssetController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.TECHNICIAN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_asset_dto_1.CreateAssetDto]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.TENANT_OWNER, client_1.Role.TENANT_ADMIN, client_1.Role.MANAGER, client_1.Role.TECHNICIAN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AssetController.prototype, "findAll", null);
exports.AssetController = AssetController = __decorate([
    (0, common_1.Controller)('assets'),
    __metadata("design:paramtypes", [asset_service_1.AssetService])
], AssetController);
//# sourceMappingURL=asset.controller.js.map