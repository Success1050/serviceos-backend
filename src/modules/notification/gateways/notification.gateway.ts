import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { decodeJwt } from 'jose';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || (client.handshake.auth.token as string);
      
      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (client.handshake.auth.token) {
        token = client.handshake.auth.token;
      }

      if (!token) {
        client.disconnect();
        return;
      }
      
      const payload = decodeJwt(token);
      
      const tenantId = payload.tenantId as string;
      const userId = payload.sub as string; 
      const customerRecordId = payload.customerRecordId as string | undefined;
      const relationshipId = payload.relationshipId as string | undefined;

      if (!tenantId || !userId) {
        client.disconnect();
        return;
      }

      // Join tenant-wide room
      client.join(`tenant_${tenantId}`);
      // Join user-specific room
      client.join(`tenant_${tenantId}_user_${userId}`);

      // If customer identity, join customer record and relationship scoped rooms
      if (customerRecordId) {
        client.join(`tenant_${tenantId}_customer_${customerRecordId}`);
      }
      if (relationshipId) {
        client.join(`tenant_${tenantId}_rel_${relationshipId}`);
      }

      console.log(`[WebSocket] Client connected: Tenant ${tenantId}, User ${userId}${customerRecordId ? `, CustomerRecord: ${customerRecordId}` : ''}`);
    } catch (e: any) {
      console.log(`[WebSocket] Auth failed:`, e?.message || e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  sendToTenant(tenantId: string, event: string, payload: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, payload);
  }

  sendToUser(tenantId: string, userId: string, event: string, payload: any) {
    this.server.to(`tenant_${tenantId}_user_${userId}`).emit(event, payload);
  }

  sendToCustomer(tenantId: string, customerRecordId: string, event: string, payload: any) {
    this.server.to(`tenant_${tenantId}_customer_${customerRecordId}`).emit(event, payload);
  }
}
