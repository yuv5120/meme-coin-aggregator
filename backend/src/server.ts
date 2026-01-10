import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cron from 'node-cron';
import { config } from './config';
import { CacheService } from './services/CacheService';
import { Aggregator } from './services/Aggregator';
import { WebSocketService } from './services/WebSocketService';
import { createTokenRoutes } from './routes/tokens';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Initialize services
const cache = new CacheService();
const aggregator = new Aggregator(cache);
const wsService = new WebSocketService(server);

// Routes
app.use('/api', createTokenRoutes(aggregator));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Meme Coin Aggregation API',
        version: '1.0.0',
        endpoints: {
            tokens: '/api/tokens',
            health: '/api/health',
            websocket: 'ws://localhost:' + config.port,
        },
    });
});

// Schedule periodic updates every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
    try {
        console.log('🔄 Running scheduled update...');

        const tokens = await aggregator.getTokens({ limit: 30, skipCache: true });
        const { priceChanges, volumeSpikes } = aggregator.detectChanges(tokens);

        // Send updates via WebSocket
        if (priceChanges.length > 0) {
            wsService.sendPriceChanges(priceChanges);
        }

        if (volumeSpikes.length > 0) {
            wsService.sendVolumeSpikes(volumeSpikes);
        }

        // Broadcast all tokens to keep clients in sync
        wsService.broadcastUpdate(tokens);

        console.log(`✅ Update complete: ${tokens.length} tokens, ${priceChanges.length} price changes, ${volumeSpikes.length} volume spikes`);
    } catch (error) {
        console.error('❌ Scheduled update error:', error);
    }
});

// Initial data load on server start
async function loadInitialData() {
    try {
        console.log('📊 Loading initial data...');
        const tokens = await aggregator.getTokens({ limit: 30 });
        wsService.sendInitialData(tokens);
        console.log(`✅ Initial data loaded: ${tokens.length} tokens`);
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
    }
}

// Start server
server.listen(config.port, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 Meme Coin Aggregation Server         ║
╚════════════════════════════════════════════╝

📡 Server running on port ${config.port}
🌐 API: http://localhost:${config.port}/api
🔌 WebSocket: ws://localhost:${config.port}
💾 Redis: ${config.redis.host}:${config.redis.port}
⏱️  Cache TTL: ${config.cache.ttl}s
  `);

    // Load initial data immediately after server starts
    loadInitialData();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await cache.disconnect();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
