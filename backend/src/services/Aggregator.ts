import { DexScreenerProvider } from '../providers/DexScreenerProvider';
import { JupiterProvider } from '../providers/JupiterProvider';
import { CoinGeckoProvider } from '../providers/CoinGeckoProvider';
import { CacheService } from './CacheService';
import { Token, FilterOptions } from '../types';
import { config } from '../config';

export class Aggregator {
    private dexScreener: DexScreenerProvider;
    private jupiter: JupiterProvider;
    private coinGecko: CoinGeckoProvider;
    private cache: CacheService;
    private previousTokens: Map<string, Token> = new Map();

    constructor(cache: CacheService) {
        this.dexScreener = new DexScreenerProvider();
        this.jupiter = new JupiterProvider();
        this.coinGecko = new CoinGeckoProvider();
        this.cache = cache;
    }

    async getTokens(options: FilterOptions = {}): Promise<Token[]> {
        const cacheKey = this.getCacheKey(options);

        // Try cache first (unless skipping)
        if (!options.skipCache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) {
                console.log('✅ Cache hit for:', cacheKey);
                return this.applyFiltersAndSort(cached, options);
            }
        }

        console.log('⚠️ Cache miss, fetching from APIs...');

        // Fetch from both providers concurrently
        const [dexTokens, jupiterTokens] = await Promise.all([
            this.dexScreener.fetchTokens(),
            this.jupiter.fetchTokens(),
        ]);

        // Merge tokens intelligently
        let mergedTokens = this.mergeTokens(dexTokens, jupiterTokens);

        // Enrich with 7-day price data from CoinGecko
        mergedTokens = await this.coinGecko.enrich7DayData(mergedTokens);

        // Store in cache
        await this.cache.set(cacheKey, mergedTokens);

        return this.applyFiltersAndSort(mergedTokens, options);
    }

    private mergeTokens(dexTokens: Token[], jupiterTokens: Token[]): Token[] {
        const tokenMap = new Map<string, Token>();

        // Add DexScreener tokens first
        dexTokens.forEach(token => {
            if (token && token.token_address) {
                tokenMap.set(token.token_address.toLowerCase(), token);
            }
        });

        // Merge or add Jupiter tokens
        jupiterTokens.forEach(jupToken => {
            if (!jupToken || !jupToken.token_address) {
                return; // Skip invalid tokens
            }

            const address = jupToken.token_address.toLowerCase();
            const existing = tokenMap.get(address);

            if (existing) {
                // Merge data from both sources
                tokenMap.set(address, {
                    ...existing,
                    sources: [...(existing.sources || []), 'Jupiter'],
                    // Keep DexScreener data as primary since it has more complete info
                    volume_sol: Math.max(existing.volume_sol, jupToken.volume_sol),
                });
            } else {
                // Add Jupiter-only token
                tokenMap.set(address, jupToken);
            }
        });

        return Array.from(tokenMap.values());
    }

    private applyFiltersAndSort(tokens: Token[], options: FilterOptions): Token[] {
        let filtered = [...tokens];

        // Apply period filter
        if (options.period) {
            // For now, we'll just use the data we have
            // In production, you'd filter based on the time period
        }

        // Apply sorting
        if (options.sortBy) {
            filtered = this.sortTokens(filtered, options.sortBy);
        }

        // Apply pagination
        const limit = Math.min(options.limit || config.pagination.defaultLimit, config.pagination.maxLimit);

        return filtered.slice(0, limit);
    }

    private sortTokens(tokens: Token[], sortBy: string): Token[] {
        const sorted = [...tokens];

        switch (sortBy) {
            case 'volume':
                sorted.sort((a, b) => b.volume_sol - a.volume_sol);
                break;
            case 'price_change':
                sorted.sort((a, b) => b.price_1hr_change - a.price_1hr_change);
                break;
            case 'market_cap':
                sorted.sort((a, b) => b.market_cap_sol - a.market_cap_sol);
                break;
            default:
                // Default: sort by volume
                sorted.sort((a, b) => b.volume_sol - a.volume_sol);
        }

        return sorted;
    }

    detectChanges(currentTokens: Token[]): { priceChanges: Token[]; volumeSpikes: Token[] } {
        const priceChanges: Token[] = [];
        const volumeSpikes: Token[] = [];

        currentTokens.forEach(token => {
            const previous = this.previousTokens.get(token.token_address);

            if (previous) {
                // Detect significant price changes (>5%)
                const priceChangePercent = Math.abs(
                    ((token.price_sol - previous.price_sol) / previous.price_sol) * 100
                );
                if (priceChangePercent > 5) {
                    priceChanges.push(token);
                }

                // Detect volume spikes (>50% increase)
                const volumeIncrease = ((token.volume_sol - previous.volume_sol) / previous.volume_sol) * 100;
                if (volumeIncrease > 50) {
                    volumeSpikes.push(token);
                }
            }

            // Update previous tokens
            this.previousTokens.set(token.token_address, token);
        });

        return { priceChanges, volumeSpikes };
    }

    private getCacheKey(options: FilterOptions): string {
        return `tokens:${options.period || 'all'}:${options.sortBy || 'default'}`;
    }
}
