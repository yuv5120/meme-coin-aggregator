import React from 'react';

interface FilterBarProps {
    period: '1h' | '24h' | '7d';
    sortBy: 'volume' | 'price_change' | 'market_cap';
    order: 'asc' | 'desc';
    onPeriodChange: (period: '1h' | '24h' | '7d') => void;
    onSortChange: (sort: 'volume' | 'price_change' | 'market_cap') => void;
    onOrderChange: (order: 'asc' | 'desc') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    period,
    sortBy,
    order,
    onPeriodChange,
    onSortChange,
    onOrderChange,
    searchQuery,
    onSearchChange,
}) => {
    return (
        <div className="filter-bar">
            {/* Search */}
            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Time Period */}
            <div className="filter-group">
                <label>TIME PERIOD</label>
                <select
                    value={period}
                    onChange={(e) => onPeriodChange(e.target.value as '1h' | '24h' | '7d')}
                    className="filter-select"
                >
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
                <label>SORT BY</label>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value as 'volume' | 'price_change' | 'market_cap')}
                    className="filter-select"
                >
                    <option value="volume">Volume</option>
                    <option value="price_change">Price Change</option>
                    <option value="market_cap">Market Cap</option>
                </select>
            </div>

            {/* Order */}
            <div className="filter-group">
                <label>ORDER</label>
                <select
                    value={order}
                    onChange={(e) => onOrderChange(e.target.value as 'asc' | 'desc')}
                    className="filter-select"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
        </div>
    );
};
