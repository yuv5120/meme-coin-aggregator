import axios, { AxiosInstance } from 'axios';
import { Token } from '../types';

interface CoinGeckoMarketChart {
    prices: [number, number][]; // [timestamp, price]
}

interface TokenMapping {
    address: string;
    coingeckoId: string;
}

export class CoinGeckoProvider {
    private client: AxiosInstance;
    private tokenMappings: TokenMapping[] = [
        { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', coingeckoId: 'bonk' },
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', coingeckoId: 'usd-coin' },
        { address: 'So11111111111111111111111111111111111111112', coingeckoId: 'solana' },
        { address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', coingeckoId: 'msol' },
        { address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', coingeckoId: 'jito-staked-sol' },
        // Add more mappings as needed
    ];

    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.coingecko.com/api/v3',
            timeout: 10000,
        });
    }

    async get7DayPriceChange(tokenAddress: string): Promise<number | null> {
        try {
            // Find CoinGecko ID for this token address
            const mapping = this.tokenMappings.find(m =>
                m.address.toLowerCase() === tokenAddress.toLowerCase()
            );

            if (!mapping) {
                return null; // Token not mapped to CoinGecko
            }

            // Fetch 7-day historical data
            const response = await this.client.get<CoinGeckoMarketChart>(
                `/coins/${mapping.coingeckoId}/market_chart`,
                {
                    params: {
                        vs_currency: 'usd',
                        days: 7,
                    }
                }
            );

            const prices = response.data.prices;
            if (!prices || prices.length < 2) {
                return null;
            }

            // Calculate 7-day price change
            const firstPrice = prices[0][1];
            const lastPrice = prices[prices.length - 1][1];
            const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

            return priceChange;
        } catch (error) {
            console.error(`CoinGecko error for ${tokenAddress}:`, error);
            return null;
        }
    }

    async enrich7DayData(tokens: Token[]): Promise<Token[]> {
        // Fetch 7-day data for all tokens in parallel
        const enrichedTokens = await Promise.all(
            tokens.map(async (token) => {
                const price7dChange = await this.get7DayPriceChange(token.token_address);
                return {
                    ...token,
                    price_7d_change: price7dChange !== null ? price7dChange : undefined,
                };
            })
        );

        return enrichedTokens;
    }

    // Add a token mapping
    addTokenMapping(address: string, coingeckoId: string) {
        this.tokenMappings.push({ address, coingeckoId });
    }

    // Get all current mappings
    getMappings(): TokenMapping[] {
        return this.tokenMappings;
    }
}
