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
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let WarehouseService = class WarehouseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWarehouse(tenantId, data) {
        return this.prisma.warehouse.create({
            data: {
                tenantId,
                name: data.name,
                type: data.type,
                assignedTechnicianId: data.assignedTechnicianId,
            }
        });
    }
    async createEquipmentRequest(tenantId, data) {
        return this.prisma.equipmentRequest.create({
            data: {
                tenantId,
                hqWarehouseId: data.hqWarehouseId,
                productId: data.productId,
                quantity: data.quantity,
                status: 'PENDING'
            }
        });
    }
    async approveEquipmentRequest(tenantId, requestId, virtualTruckId) {
        const request = await this.prisma.equipmentRequest.findUnique({
            where: { id: requestId, tenantId }
        });
        if (!request)
            throw new common_1.NotFoundException('Equipment request not found');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Request is not pending');
        return this.prisma.$transaction(async (prisma) => {
            const approvedRequest = await prisma.equipmentRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            });
            const hqInventory = await prisma.inventoryItem.findUnique({
                where: { warehouseId_productId: { warehouseId: request.hqWarehouseId, productId: request.productId } }
            });
            if (!hqInventory || hqInventory.quantity < request.quantity) {
                throw new common_1.BadRequestException('Insufficient inventory in HQ Warehouse');
            }
            await prisma.inventoryItem.update({
                where: { id: hqInventory.id },
                data: { quantity: { decrement: request.quantity } }
            });
            const truckInventory = await prisma.inventoryItem.findUnique({
                where: { warehouseId_productId: { warehouseId: virtualTruckId, productId: request.productId } }
            });
            if (truckInventory) {
                await prisma.inventoryItem.update({
                    where: { id: truckInventory.id },
                    data: { quantity: { increment: request.quantity } }
                });
            }
            else {
                await prisma.inventoryItem.create({
                    data: {
                        warehouseId: virtualTruckId,
                        productId: request.productId,
                        quantity: request.quantity,
                    }
                });
            }
            return approvedRequest;
        });
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map