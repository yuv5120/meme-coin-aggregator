import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config';
import { WebSocketUpdate, Token } from '../types';

export class WebSocketService {
    private io: SocketIOServer;
    private connectedClients = 0;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: config.cors.origin,
                methods: ['GET', 'POST'],
            },
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket) => {
            this.connectedClients++;
            console.log(`✅ Client connected (${this.connectedClients} total)`);

            socket.on('disconnect', () => {
                this.connectedClients--;
                console.log(`❌ Client disconnected (${this.connectedClients} remaining)`);
            });

            socket.on('request_initial_data', () => {
                console.log('📡 Client requested initial data');
            });
        });
    }

    sendInitialData(tokens: Token[]): void {
        const update: WebSocketUpdate = {
            type: 'initial_data',
            tokens,
            timestamp: Date.now(),
        };

        this.io.emit('initial_data', update);
        console.log(`📤 Sent initial data: ${tokens.length} tokens`);
    }

    sendPriceChanges(tokens: Token[]): void {
        if (tokens.length === 0) return;

        const update: WebSocketUpdate = {
            type: 'price_change',
            tokens,
            timestamp: Date.now(),
        };

        this.io.emit('price_change', update);
        console.log(`📤 Sent price changes: ${tokens.length} tokens`);
    }

    sendVolumeSpikes(tokens: Token[]): void {
        if (tokens.length === 0) return;

        const update: WebSocketUpdate = {
            type: 'volume_spike',
            tokens,
            timestamp: Date.now(),
        };

        this.io.emit('volume_spike', update);
        console.log(`📤 Sent volume spikes: ${tokens.length} tokens`);
    }

    broadcastUpdate(tokens: Token[]): void {
        this.io.emit('tokens_update', {
            tokens,
            timestamp: Date.now(),
        });
    }

    getConnectedClients(): number {
        return this.connectedClients;
    }
}
