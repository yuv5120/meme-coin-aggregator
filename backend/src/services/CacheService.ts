import Redis from 'ioredis';
import { config } from '../config';
import { Token } from '../types';

export class CacheService {
    private client: Redis;
    private isConnected = false;

    constructor() {
        this.client = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        this.client.on('connect', () => {
            console.log('✅ Redis connected');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis error:', err.message);
            this.isConnected = false;
        });
    }

    async get(key: string): Promise<Token[] | null> {
        try {
            if (!this.isConnected) {
                console.warn('Redis not connected, skipping cache get');
                return null;
            }

            const data = await this.client.get(key);
            if (!data) return null;

            return JSON.parse(data);
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: Token[], ttl: number = config.cache.ttl): Promise<void> {
        try {
            if (!this.isConnected) {
                console.warn('Redis not connected, skipping cache set');
                return;
            }

            await this.client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            if (!this.isConnected) {
                return;
            }

            await this.client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    isReady(): boolean {
        return this.isConnected;
    }
}
