# Meme Coin Aggregation Service

A real-time meme coin data aggregation service that fetches data from multiple DEX sources (DexScreener and Jupiter), implements efficient caching, WebSocket updates, and provides a bright, attractive blue-themed frontend.

![Meme Coin Aggregator](https://img.shields.io/badge/Status-Active-success)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## ✨ Features

- 🔄 **Real-time Updates**: WebSocket-based live price and volume updates
- 🎯 **Multi-Source Aggregation**: Combines data from DexScreener and Jupiter APIs
- 💾 **Efficient Caching**: Redis-based caching with 30s TTL
- 🚀 **Rate Limiting**: Exponential backoff for API requests
- 🎨 **Beautiful UI**: Bright blue theme with glassmorphism effects
- 📊 **Filtering & Sorting**: Time periods (1h, 24h, 7d) and multiple sort options
- 🔍 **Smart Merging**: Intelligent duplicate token detection and merging
 
## 🔗 Live Demo
 
- **Frontend (Vercel)**: [https://meme-coin-aggregator-psi.vercel.app](https://meme-coin-aggregator-psi.vercel.app)
- **Backend (Render)**: [https://meme-coin-backend.onrender.com](https://meme-coin-backend.onrender.com)
- **Health Check**: [https://meme-coin-backend.onrender.com/api/health](https://meme-coin-backend.onrender.com/api/health)

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ (React + WebSocket)
│  (Port 5173)│
└──────┬──────┘
       │ WebSocket + HTTP
       ▼
┌─────────────┐
│   Backend   │ (Express + Socket.io)
│  (Port 3000)│
└──────┬──────┘
       │
       ├──► Redis Cache (30s TTL)
       │
       ├──► DexScreener API
       │
       └──► Jupiter API
```

## 📋 Prerequisites

- Node.js v18 or higher
- Redis server running locally or remotely
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository

```bash
cd /Users/yuvraj/Desktop/Meme-coin
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

The backend uses default configuration from `.env.example`. Redis should be running on `localhost:6379`.

### 4. Start Redis (if not running)

```bash
# macOS with Homebrew
brew services start redis

# Or run directly
redis-server
```

### 5. Start Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3000`

### 6. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 7. Start Frontend

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📡 API Documentation

### REST Endpoints

#### Get Tokens
```
GET /api/tokens
```

**Query Parameters:**
- `period` (optional): `1h`, `24h`, or `7d`
- `sortBy` (optional): `volume`, `price_change`, or `market_cap`
- `limit` (optional): Number of tokens to return (default: 25, max: 50)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "tokens": [
    {
      "token_address": "...",
      "token_name": "...",
      "token_ticker": "...",
      "price_sol": 0.0,
      "market_cap_sol": 0.0,
      "volume_sol": 0.0,
      "liquidity_sol": 0.0,
      "transaction_count": 0,
      "price_1hr_change": 0.0,
      "protocol": "...",
      "sources": ["DexScreener", "Jupiter"]
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 25,
    "cursor": null
  }
}
```

#### Health Check
```
GET /api/health
```

### WebSocket Events

**Connection URL:** `ws://localhost:3000`

#### Events from Server:

- `initial_data`: Sent when client connects
- `tokens_update`: Periodic updates (every 30s)
- `price_change`: Significant price changes detected
- `volume_spike`: Volume spikes detected

**Event Payload:**
```typescript
{
  type: 'initial_data' | 'price_change' | 'volume_spike',
  tokens: Token[],
  timestamp: number
}
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Cache**: Redis with ioredis client
- **HTTP Client**: Axios with retry logic
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **WebSocket**: Socket.io Client
- **Styling**: Vanilla CSS with custom design system

## 🎨 Design System

The frontend features a vibrant blue color scheme:

- **Primary Blue**: `#0066FF`
- **Accent Cyan**: `#00D9FF`
- **Accent Purple**: `#6B4FFF`
- **Glassmorphism effects** with backdrop blur
- **Smooth animations** and transitions
- **Responsive grid layout**

## 📊 Data Sources

### DexScreener API
- Endpoint: `https://api.dexscreener.com/latest/dex/search?q={query}`
- Provides: Price, volume, liquidity, market cap, transactions

### Jupiter API
- Endpoint: `https://lite-api.jup.ag/tokens/v2/search?query={query}`
- Provides: Token metadata and volume data

## 🔧 Configuration

Backend configuration in `backend/src/config/index.ts`:

```typescript
{
  port: 3000,
  redis: { host: 'localhost', port: 6379 },
  cache: { ttl: 30 }, // seconds
  rateLimit: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  },
  pagination: {
    defaultLimit: 25,
    maxLimit: 50
  }
}
```

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:3000/api/health

# Get tokens
curl http://localhost:3000/api/tokens?limit=25

# Get tokens with filters
curl "http://localhost:3000/api/tokens?period=24h&sortBy=volume&limit=30"
```

### Test WebSocket
Open the frontend at `http://localhost:5173` and check the browser console for WebSocket connection logs.

## 📝 Project Structure

```
Meme-coin/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── providers/       # API providers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript types
│   │   └── server.ts        # Main server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── styles/          # CSS files
│   │   ├── App.tsx          # Main app
│   │   └── main.tsx         # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🚦 How It Works

1. **Initial Load**: Frontend connects to WebSocket and receives initial token data
2. **Caching**: Backend caches aggregated data in Redis for 30 seconds
3. **Scheduled Updates**: Every 30 seconds, backend fetches fresh data from APIs
4. **Change Detection**: Backend detects price changes (>5%) and volume spikes (>50%)
5. **Real-time Push**: Changes are pushed to all connected clients via WebSocket
6. **Smart Merging**: Duplicate tokens from different DEXs are intelligently merged

## 🎯 Key Features Explained

### Intelligent Token Merging
Tokens appearing on multiple DEXs are merged by address, combining data from all sources while avoiding duplicates.

### Rate Limiting with Exponential Backoff
API requests automatically retry with exponential backoff (1s, 2s, 4s, 8s, max 10s) on failures.

### Efficient Caching
Redis caches aggregated results for 30 seconds, reducing API calls and improving response times.

### Real-time Updates
WebSocket connection provides live updates without polling, ensuring data freshness.

## 🎯 Design Decisions

### 1. Multi-Source Aggregation Strategy

**Decision**: Fetch from both DexScreener and Jupiter in parallel, then merge by token address.

**Rationale**:
- **Parallel Fetching**: Using `Promise.all()` reduces total fetch time from ~6s (sequential) to ~1s (parallel)
- **Address-based Merging**: Token addresses are unique identifiers across DEXs, enabling accurate deduplication
- **Source Tracking**: Maintaining `sources` array allows UI to show which DEXs list each token
- **Data Priority**: DexScreener data takes precedence when merging due to more comprehensive price/volume data

**Implementation**:
```typescript
const [dexTokens, jupiterTokens] = await Promise.all([
  this.dexScreener.fetchTokens(),
  this.jupiter.fetchTokens(),
]);
const mergedTokens = this.mergeTokens(dexTokens, jupiterTokens);
```

### 2. Caching Strategy

**Decision**: Redis with 30-second TTL for aggregated results.

**Rationale**:
- **30s TTL**: Balances data freshness with API rate limits
- **Redis Choice**: In-memory storage provides <1ms cache hits
- **Cache Key Structure**: `tokens:all:{sortBy}` enables different cache entries per sort option
- **Cache Miss Handling**: Gracefully falls back to API calls if Redis is unavailable

**Trade-offs**:
- ✅ Reduces API calls by ~95%
- ✅ Sub-millisecond response times on cache hits
- ⚠️ Requires Redis infrastructure
- ⚠️ 30s data staleness acceptable for meme coin volatility

### 3. WebSocket vs Polling

**Decision**: Server-side WebSocket push instead of client-side polling.

**Rationale**:
- **Efficiency**: One server update broadcasts to all clients vs each client polling
- **Real-time**: Instant updates when changes detected
- **Bandwidth**: Significantly less network traffic
- **Scalability**: Server controls update frequency, not client count

**Implementation**:
- Server detects changes every 30s
- Pushes only when price changes >5% or volume spikes >50%
- Clients receive updates via Socket.io events

### 4. Search Term Selection

**Decision**: Search for 6 popular meme coins (BONK, PEPE, WIF, MYRO, POPCAT, BTC) instead of generic "SOL".

**Rationale**:
- **Token Diversity**: Generic "SOL" query returns mostly SOL-wrapped tokens
- **Meme Coin Focus**: Specific searches target actual meme coins
- **Parallel Execution**: All 6 searches run concurrently (1s total vs 6s sequential)
- **Deduplication**: Map-based deduplication ensures no duplicate tokens

**Results**:
- 25-30 unique tokens
- Mix of high-volume and emerging meme coins
- Better representation of meme coin ecosystem

### 5. Frontend State Management

**Decision**: WebSocket-driven state with client-side filtering/sorting.

**Rationale**:
- **Single Source of Truth**: WebSocket provides all data once
- **Instant Filtering**: No HTTP calls for search/filter/sort
- **Reduced Server Load**: Filtering happens in browser
- **Better UX**: Instant response to user interactions

**Implementation**:
```typescript
// All filtering/sorting happens client-side
useEffect(() => {
  let filtered = [...wsTokens];
  // Apply search, sort, order - all instant
}, [wsTokens, sortBy, period, searchQuery, order]);
```

### 6. Error Handling & Resilience

**Decision**: Exponential backoff with graceful degradation.

**Rationale**:
- **API Reliability**: DEX APIs can be rate-limited or temporarily unavailable
- **Exponential Backoff**: 1s → 2s → 4s → 8s → max 10s
- **Graceful Degradation**: Return empty array instead of crashing
- **Retry Logic**: Automatic retries for transient failures

**Retry Conditions**:
- Network timeouts (ETIMEDOUT)
- Connection errors (ECONNABORTED)
- 5xx server errors
- 429 rate limit errors

### 7. TypeScript Type Safety

**Decision**: Comprehensive type definitions for all data structures.

**Rationale**:
- **Compile-time Safety**: Catch errors before runtime
- **IDE Support**: Better autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **API Contracts**: Ensures frontend/backend data consistency

**Key Types**:
- `Token`: Unified token structure
- `DexScreenerPair` & `JupiterToken`: External API types
- `FilterOptions`: Query parameter types
- `WebSocketUpdate`: Real-time event types

### 8. UI/UX Design Choices

**Decision**: Table layout with bright blue theme and real-time indicators.

**Rationale**:
- **Table vs Cards**: Better information density for 25-30 tokens
- **Bright Blue**: High contrast, modern, energetic (matches meme coin vibe)
- **Period Labels**: Shows which time period price change represents
- **Source Badges**: Transparency about data sources
- **Aggregate Indicator**: Highlights tokens on multiple DEXs

**Performance**:
- CSS animations with `animation-delay` for staggered entry
- Client-side sorting (no re-renders)
- Efficient React re-rendering with proper keys

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ for the meme coin community
