import { useState, useEffect } from 'react';
import { FilterBar } from './components/FilterBar';
import { TokenTable } from './components/TokenTable';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/index.css';

const WS_URL = 'http://localhost:3000';

function App() {
    const { isConnected, tokens: wsTokens, lastUpdate } = useWebSocket(WS_URL);
    const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');
    const [sortBy, setSortBy] = useState<'volume' | 'price_change' | 'market_cap'>('volume');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayTokens, setDisplayTokens] = useState(wsTokens);
    const [loading, setLoading] = useState(true);

    // Update display tokens when WebSocket data changes
    useEffect(() => {
        if (wsTokens.length > 0) {
            setLoading(false);
            let filtered = [...wsTokens];

            // Apply search filter
            if (searchQuery) {
                filtered = filtered.filter(token =>
                    token.token_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    token.token_ticker.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Apply sorting
            switch (sortBy) {
                case 'volume':
                    filtered.sort((a, b) => b.volume_sol - a.volume_sol);
                    break;
                case 'price_change':
                    // Use appropriate price change based on period
                    if (period === '1h') {
                        filtered.sort((a, b) => b.price_1hr_change - a.price_1hr_change);
                    } else if (period === '24h') {
                        filtered.sort((a, b) => (b.price_24hr_change || 0) - (a.price_24hr_change || 0));
                    } else {
                        // 7d - use 24h change as fallback
                        filtered.sort((a, b) => (b.price_24hr_change || b.price_1hr_change) - (a.price_24hr_change || a.price_1hr_change));
                    }
                    break;
                case 'market_cap':
                    filtered.sort((a, b) => b.market_cap_sol - a.market_cap_sol);
                    break;
            }

            // Apply order (ascending/descending)
            if (order === 'asc') {
                filtered.reverse();
            }

            setDisplayTokens(filtered);
        }
    }, [wsTokens, sortBy, period, searchQuery, order]);

    const formatLastUpdate = () => {
        const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    };

    return (
        <div className="container">
            {/* Header */}
            <header className="header">
                <div className="header-title">
                    <span style={{ fontSize: '2rem' }}>🚀</span>
                    <h1>Meme Coin Aggregator</h1>
                </div>

                <div className="header-stats">
                    <div className="stat-box">
                        <div className="stat-label">Tokens</div>
                        <div className="stat-value">{displayTokens.length}</div>
                    </div>

                    <div className="status-indicator">
                        <div className="stat-label">Status</div>
                        <div className="status-dot"></div>
                        <span style={{ fontWeight: '600', color: 'var(--success)' }}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <FilterBar
                period={period}
                sortBy={sortBy}
                order={order}
                searchQuery={searchQuery}
                onPeriodChange={setPeriod}
                onSortChange={setSortBy}
                onOrderChange={setOrder}
                onSearchChange={setSearchQuery}
            />

            {/* Token Table */}
            <TokenTable tokens={displayTokens} loading={loading} period={period} />

            {/* Footer */}
            <div style={{
                textAlign: 'center',
                padding: 'var(--spacing-lg) 0',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
            }}>
                <p>Data aggregated from DexScreener and Jupiter APIs</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Updates every 30 seconds • Last update: {formatLastUpdate()}
                </p>
            </div>
        </div>
    );
}

export default App;
