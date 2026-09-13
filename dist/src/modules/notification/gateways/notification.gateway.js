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
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jose_1 = require("jose");
let NotificationGateway = class NotificationGateway {
    server;
    handleConnection(client) {
        try {
            const authHeader = client.handshake.headers.authorization || client.handshake.auth.token;
            let token = '';
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
            else if (client.handshake.auth.token) {
                token = client.handshake.auth.token;
            }
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = (0, jose_1.decodeJwt)(token);
            const tenantId = payload.tenantId;
            const userId = payload.sub;
            if (!tenantId || !userId) {
                client.disconnect();
                return;
            }
            client.join(`tenant_${tenantId}`);
            client.join(`tenant_${tenantId}_user_${userId}`);
            console.log(`[WebSocket] Client connected: Tenant ${tenantId}, User ${userId}`);
        }
        catch (e) {
            console.log(`[WebSocket] Auth failed:`, e.message);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        console.log(`[WebSocket] Client disconnected: ${client.id}`);
    }
    sendToTenant(tenantId, event, payload) {
        this.server.to(`tenant_${tenantId}`).emit(event, payload);
    }
    sendToUser(tenantId, userId, event, payload) {
        this.server.to(`tenant_${tenantId}_user_${userId}`).emit(event, payload);
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
exports.NotificationGateway = NotificationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map