import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/kitchen',
  cors: {
    origin: (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  }
})
export class KitchenGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const serverKey = process.env.API_KEY;
    const clientKey = String(client.handshake.auth?.apiKey || '');

    if (!serverKey || clientKey !== serverKey) {
      client.disconnect(true);
    }
  }

  emitOrderUpdated(payload: unknown) {
    this.server.emit('order.updated', payload);
  }

  emitKotSent(payload: unknown) {
    this.server.emit('order.kot_sent', payload);
  }
}
