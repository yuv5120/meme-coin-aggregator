import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '30', 10), // seconds
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
    apis: {
        dexScreener: {
            baseUrl: 'https://api.dexscreener.com',
            searchEndpoint: '/latest/dex/search',
        },
        jupiter: {
            baseUrl: 'https://lite-api.jup.ag',
            searchEndpoint: '/tokens/v2/search',
        },
    },
    rateLimit: {
        maxRetries: 3,
        baseDelay: 1000, // ms
        maxDelay: 10000, // ms
    },
    pagination: {
        defaultLimit: 25,
        maxLimit: 50,
    },
};
