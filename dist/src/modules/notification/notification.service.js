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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notification_gateway_1 = require("./gateways/notification.gateway");
let NotificationService = class NotificationService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async sendToUser(tenantId, userId, title, message, type = 'INFO', linkUrl) {
        const notification = await this.prisma.notification.create({
            data: { tenantId, userId, title, message, type, linkUrl },
        });
        this.gateway.sendToUser(tenantId, userId, 'notification', notification);
        return notification;
    }
    async sendToTenant(tenantId, title, message, type = 'INFO', linkUrl) {
        const notification = await this.prisma.notification.create({
            data: { tenantId, title, message, type, linkUrl },
        });
        this.gateway.sendToTenant(tenantId, 'notification', notification);
        return notification;
    }
    async getUnreadForUser(tenantId, userId) {
        return this.prisma.notification.findMany({
            where: { tenantId, userId, isRead: false },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRecentForTenant(tenantId) {
        return this.prisma.notification.findMany({
            where: { tenantId, userId: null },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway])
], NotificationService);
//# sourceMappingURL=notification.service.js.map