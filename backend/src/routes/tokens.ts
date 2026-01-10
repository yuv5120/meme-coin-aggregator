import { Router, Request, Response } from 'express';
import { Aggregator } from '../services/Aggregator';
import { FilterOptions, TokenResponse } from '../types';
import { config } from '../config';

export function createTokenRoutes(aggregator: Aggregator): Router {
    const router = Router();

    router.get('/tokens', async (req: Request, res: Response) => {
        try {
            const options: FilterOptions = {
                period: req.query.period as '1h' | '24h' | '7d' | undefined,
                sortBy: req.query.sortBy as 'volume' | 'price_change' | 'market_cap' | undefined,
                limit: req.query.limit ? parseInt(req.query.limit as string) : config.pagination.defaultLimit,
                cursor: req.query.cursor as string | undefined,
            };

            const tokens = await aggregator.getTokens(options);

            const response: TokenResponse = {
                tokens,
                pagination: {
                    total: tokens.length,
                    limit: options.limit || config.pagination.defaultLimit,
                    cursor: undefined, // Can implement cursor-based pagination later
                },
            };

            res.json(response);
        } catch (error) {
            console.error('Error fetching tokens:', error);
            res.status(500).json({ error: 'Failed to fetch tokens' });
        }
    });

    router.get('/health', (req: Request, res: Response) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    return router;
}
