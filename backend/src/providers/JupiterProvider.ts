import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Token, JupiterToken } from '../types';

export class JupiterProvider {
    private client: AxiosInstance;
    private retryCount = 0;

    constructor() {
        this.client = axios.create({
            baseURL: config.apis.jupiter.baseUrl,
            timeout: 10000,
        });
    }

    async fetchTokens(query: string = 'SOL'): Promise<Token[]> {
        try {
            const response = await this.retryWithBackoff<{ data: JupiterToken[] }>(
                () => this.client.get(`${config.apis.jupiter.searchEndpoint}?query=${query}`)
            );

            if (!response.data || !Array.isArray(response.data)) {
                return [];
            }

            // Transform Jupiter tokens to our Token format
            const tokens = response.data
                .slice(0, 20) // Limit to 20 tokens from Jupiter
                .map(token => this.transformToToken(token));

            return tokens;
        } catch (error) {
            console.error('Jupiter API error:', error);
            return [];
        }
    }

    private transformToToken(jupToken: JupiterToken): Token {
        // Jupiter API provides comprehensive data
        return {
            token_address: jupToken.id || jupToken.address, // Use 'id' as primary address field
            token_name: jupToken.name,
            token_ticker: jupToken.symbol,
            price_sol: jupToken.usdPrice ? jupToken.usdPrice / 136.48 : 0, // Convert USD to SOL (approximate)
            market_cap_sol: jupToken.mcap ? jupToken.mcap / 136.48 : 0,
            volume_sol: jupToken.stats24h?.buyVolume && jupToken.stats24h?.sellVolume
                ? (jupToken.stats24h.buyVolume + jupToken.stats24h.sellVolume) / 136.48
                : 0,
            liquidity_sol: jupToken.liquidity ? jupToken.liquidity / 136.48 : 0,
            transaction_count: jupToken.stats24h?.numBuys && jupToken.stats24h?.numSells
                ? jupToken.stats24h.numBuys + jupToken.stats24h.numSells
                : 0,
            price_1hr_change: jupToken.stats1h?.priceChange || 0,
            price_24hr_change: jupToken.stats24h?.priceChange || 0,
            protocol: 'Jupiter',
            sources: ['Jupiter'],
            last_updated: Date.now(),
        };
    }

    private async retryWithBackoff<T>(
        fn: () => Promise<any>,
        retries = config.rateLimit.maxRetries
    ): Promise<T> {
        try {
            const response = await fn();
            this.retryCount = 0; // Reset on success
            return response;
        } catch (error: any) {
            if (retries === 0 || !this.isRetryableError(error)) {
                throw error;
            }

            const delay = Math.min(
                config.rateLimit.baseDelay * Math.pow(2, this.retryCount),
                config.rateLimit.maxDelay
            );

            console.log(`Retrying Jupiter request in ${delay}ms... (${retries} retries left)`);

            await this.sleep(delay);
            this.retryCount++;

            return this.retryWithBackoff(fn, retries - 1);
        }
    }

    private isRetryableError(error: any): boolean {
        return (
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            (error.response && error.response.status >= 500) ||
            (error.response && error.response.status === 429)
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
