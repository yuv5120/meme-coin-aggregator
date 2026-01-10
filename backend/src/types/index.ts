export interface Token {
    token_address: string;
    token_name: string;
    token_ticker: string;
    price_sol: number;
    market_cap_sol: number;
    volume_sol: number;
    liquidity_sol: number;
    transaction_count: number;
    price_1hr_change: number;
    price_24hr_change?: number;
    price_7d_change?: number;
    protocol: string;
    sources?: string[]; // Track which DEXs this token appears on
    last_updated?: number;
}

export interface TokenResponse {
    tokens: Token[];
    pagination: {
        total: number;
        limit: number;
        cursor?: string;
    };
}

export interface FilterOptions {
    period?: '1h' | '24h' | '7d';
    sortBy?: 'volume' | 'price_change' | 'market_cap';
    limit?: number;
    cursor?: string;
    skipCache?: boolean;
}

export interface WebSocketUpdate {
    type: 'price_change' | 'volume_spike' | 'initial_data';
    tokens: Token[];
    timestamp: number;
}

export interface DexScreenerPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd?: string;
    txns: {
        h24: {
            buys: number;
            sells: number;
        };
    };
    volume: {
        h24: number;
    };
    priceChange: {
        h1?: number;
        h24?: number;
    };
    liquidity?: {
        usd?: number;
        base?: number;
        quote?: number;
    };
    fdv?: number;
    marketCap?: number;
}

export interface DexScreenerResponse {
    schemaVersion: string;
    pairs: DexScreenerPair[];
}

export interface JupiterToken {
    id?: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
    daily_volume?: number;
    usdPrice?: number;
    mcap?: number;
    liquidity?: number;
    stats1h?: {
        priceChange?: number;
    };
    stats24h?: {
        priceChange?: number;
        buyVolume?: number;
        sellVolume?: number;
        numBuys?: number;
        numSells?: number;
    };
}
