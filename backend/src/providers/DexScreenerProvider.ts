import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { Token, DexScreenerResponse, DexScreenerPair } from '../types';

export class DexScreenerProvider {
    private client: AxiosInstance;
    private retryCount = 0;

    constructor() {
        this.client = axios.create({
            baseURL: config.apis.dexScreener.baseUrl,
            timeout: 10000,
        });
    }

    async fetchTokens(query: string = 'SOL'): Promise<Token[]> {
        try {
            // Search for popular meme coins to get diverse results
            // Make all searches in parallel for faster loading
            const searches = ['BONK', 'PEPE', 'WIF', 'MYRO', 'POPCAT', 'BTC'];

            const searchPromises = searches.map(searchTerm =>
                this.retryWithBackoff<{ data: DexScreenerResponse }>(
                    () => this.client.get(`${config.apis.dexScreener.searchEndpoint}?q=${searchTerm}`)
                ).then(response => {
                    if (response.data.pairs && response.data.pairs.length > 0) {
                        // Get top 5 pairs for each search term, filter for Solana
                        return response.data.pairs
                            .filter((pair: DexScreenerPair) => pair.chainId === 'solana')
                            .slice(0, 5)
                            .map((pair: DexScreenerPair) => this.transformToToken(pair));
                    }
                    return [];
                }).catch(error => {
                    console.error(`Error fetching ${searchTerm}:`, error);
                    return [];
                })
            );

            // Wait for all searches to complete in parallel
            const results = await Promise.all(searchPromises);
            const allTokens = results.flat();

            // Remove duplicates by token address and limit to 30
            const uniqueTokens = Array.from(
                new Map(allTokens.map(t => [t.token_address, t])).values()
            ).slice(0, 30);

            return uniqueTokens;
        } catch (error) {
            console.error('DexScreener API error:', error);
            return [];
        }
    }

    private transformToToken(pair: DexScreenerPair): Token {
        const totalTxns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

        return {
            token_address: pair.baseToken?.address || pair.pairAddress,
            token_name: pair.baseToken?.name || 'Unknown',
            token_ticker: pair.baseToken?.symbol || 'UNKNOWN',
            price_sol: parseFloat(pair.priceNative || '0'),
            market_cap_sol: pair.marketCap ? pair.marketCap / 1e9 : 0, // Convert to SOL equivalent
            volume_sol: pair.volume?.h24 || 0,
            liquidity_sol: pair.liquidity?.base || pair.liquidity?.quote || 0,
            transaction_count: totalTxns,
            price_1hr_change: pair.priceChange?.h1 || 0,
            price_24hr_change: pair.priceChange?.h24 || 0,
            protocol: pair.dexId || 'DexScreener',
            sources: ['DexScreener'],
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

            console.log(`Retrying DexScreener request in ${delay}ms... (${retries} retries left)`);

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
