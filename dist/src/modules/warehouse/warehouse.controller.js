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
exports.WarehouseController = void 0;
const common_1 = require("@nestjs/common");
const warehouse_service_1 = require("./warehouse.service");
const jwt_guard_1 = require("../../core/auth/jwt.guard");
const permissions_guard_1 = require("../../core/auth/permissions.guard");
const permissions_decorator_1 = require("../../core/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const create_warehouse_dto_1 = require("./dto/create-warehouse.dto");
const equipment_request_dto_1 = require("./dto/equipment-request.dto");
const approve_request_dto_1 = require("./dto/approve-request.dto");
const create_product_dto_1 = require("./dto/create-product.dto");
const add_stock_dto_1 = require("./dto/add-stock.dto");
let WarehouseController = class WarehouseController {
    warehouseService;
    constructor(warehouseService) {
        this.warehouseService = warehouseService;
    }
    async getWarehouses(user) {
        return this.warehouseService.getWarehouses(user.tenantId);
    }
    async createWarehouse(createWarehouseDto, user) {
        return this.warehouseService.createWarehouse(user.tenantId, createWarehouseDto);
    }
    async getWarehouseInventory(warehouseId, user) {
        return this.warehouseService.getWarehouseInventory(user.tenantId, warehouseId);
    }
    async addStock(warehouseId, addStockDto, user) {
        return this.warehouseService.addStock(user.tenantId, warehouseId, addStockDto);
    }
    async getProducts(user) {
        return this.warehouseService.getProducts(user.tenantId);
    }
    async createProduct(createProductDto, user) {
        return this.warehouseService.createProduct(user.tenantId, createProductDto);
    }
    async getEquipmentRequests(status, user) {
        return this.warehouseService.getEquipmentRequests(user.tenantId, status);
    }
    async createEquipmentRequest(equipmentRequestDto, user) {
        return this.warehouseService.createEquipmentRequest(user.tenantId, equipmentRequestDto);
    }
    async approveRequest(requestId, approveRequestDto, user) {
        return this.warehouseService.approveEquipmentRequest(user.tenantId, requestId, approveRequestDto.virtualTruckId);
    }
};
exports.WarehouseController = WarehouseController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('warehouse_view', 'warehouse_create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getWarehouses", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('warehouse_create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_warehouse_dto_1.CreateWarehouseDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "createWarehouse", null);
__decorate([
    (0, common_1.Get)(':id/inventory'),
    (0, permissions_decorator_1.Permissions)('warehouse_view', 'warehouse_create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getWarehouseInventory", null);
__decorate([
    (0, common_1.Post)(':id/stock'),
    (0, permissions_decorator_1.Permissions)('warehouse_create'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_stock_dto_1.AddStockDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "addStock", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, permissions_decorator_1.Permissions)('warehouse_view', 'warehouse_create', 'equipment_request_create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, permissions_decorator_1.Permissions)('warehouse_create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, permissions_decorator_1.Permissions)('equipment_request_approve', 'equipment_request_create'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "getEquipmentRequests", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, permissions_decorator_1.Permissions)('equipment_request_create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [equipment_request_dto_1.EquipmentRequestDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "createEquipmentRequest", null);
__decorate([
    (0, common_1.Patch)('requests/:id/approve'),
    (0, permissions_decorator_1.Permissions)('equipment_request_approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, approve_request_dto_1.ApproveRequestDto, Object]),
    __metadata("design:returntype", Promise)
], WarehouseController.prototype, "approveRequest", null);
exports.WarehouseController = WarehouseController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('warehouses'),
    __metadata("design:paramtypes", [warehouse_service_1.WarehouseService])
], WarehouseController);
//# sourceMappingURL=warehouse.controller.js.map