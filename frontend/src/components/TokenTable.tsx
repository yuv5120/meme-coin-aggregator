import React from 'react';

interface Token {
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
    protocol: string;
    sources?: string[];
}

interface TokenTableProps {
    tokens: Token[];
    loading: boolean;
    period: '1h' | '24h' | '7d';
}

export const TokenTable: React.FC<TokenTableProps> = ({ tokens, loading, period }) => {
    if (loading) {
        return (
            <div className="flex-center" style={{ padding: '4rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading tokens...</p>
                </div>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="flex-center" style={{ padding: '4rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔍</p>
                    <p style={{ color: 'var(--text-secondary)' }}>No tokens found</p>
                </div>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="token-table-container">
            <table className="token-table">
                <thead>
                    <tr>
                        <th>TOKEN</th>
                        <th>PRICE (SOL)</th>
                        <th>MARKET CAP</th>
                        <th>LIQUIDITY</th>
                        <th>VOLUME (24H)</th>
                        <th>PRICE CHANGE</th>
                        <th>PROTOCOL</th>
                        <th>SOURCES</th>
                    </tr>
                </thead>
                <tbody>
                    {tokens.map((token, index) => {
                        const isPositiveChange = token.price_1hr_change >= 0;
                        const isAggregated = token.sources && token.sources.length > 1;

                        return (
                            <tr key={token.token_address} style={{ animationDelay: `${index * 0.05}s` }}>
                                {/* Token */}
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="token-avatar">
                                            {getInitials(token.token_name)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                                {token.token_name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-blue)' }}>
                                                {token.token_ticker}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Price */}
                                <td>
                                    <span style={{ fontWeight: '500' }}>
                                        {token.price_sol.toFixed(token.price_sol < 0.001 ? 10 : 6)}
                                    </span>
                                </td>

                                {/* Market Cap */}
                                <td>
                                    {token.market_cap_sol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
                                </td>

                                {/* Liquidity */}
                                <td>
                                    {token.liquidity_sol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
                                </td>

                                {/* Volume */}
                                <td>
                                    {token.volume_sol.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL
                                </td>

                                {/* Price Change */}
                                <td>
                                    {(() => {
                                        let priceChange = token.price_1hr_change;
                                        let label = '1h';

                                        if (period === '24h' && token.price_24hr_change !== undefined) {
                                            priceChange = token.price_24hr_change;
                                            label = '24h';
                                        } else if (period === '7d' && token.price_24hr_change !== undefined) {
                                            priceChange = token.price_24hr_change;
                                            label = '24h';
                                        }

                                        const isPositive = priceChange >= 0;

                                        return (
                                            <span className={`price-badge ${isPositive ? 'price-positive' : 'price-negative'}`}>
                                                {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}% ({label})
                                            </span>
                                        );
                                    })()}
                                </td>

                                {/* Protocol */}
                                <td>
                                    <span className="protocol-badge">
                                        {token.protocol.toUpperCase()}
                                    </span>
                                </td>

                                {/* Sources */}
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {isAggregated && (
                                            <span className="source-badge aggregate">
                                                AGGREGATE
                                            </span>
                                        )}
                                        {token.sources && token.sources.map((source) => (
                                            <span key={source} className="source-badge">
                                                {source.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
