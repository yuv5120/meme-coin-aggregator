import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface WebSocketUpdate {
    type: 'price_change' | 'volume_spike' | 'initial_data';
    tokens: Token[];
    timestamp: number;
}

export const useWebSocket = (url: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    useEffect(() => {
        const socketInstance = io(url, {
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('initial_data', (update: WebSocketUpdate) => {
            console.log('📥 Received initial data:', update.tokens.length, 'tokens');
            setTokens(update.tokens);
            setLastUpdate(update.timestamp);
        });

        socketInstance.on('tokens_update', (data: { tokens: Token[]; timestamp: number }) => {
            console.log('🔄 Received token update:', data.tokens.length, 'tokens');
            setTokens(data.tokens);
            setLastUpdate(data.timestamp);
        });

        socketInstance.on('price_change', (update: WebSocketUpdate) => {
            console.log('💰 Price changes detected:', update.tokens.length);
            // Update specific tokens that had price changes
            setTokens(prevTokens => {
                const updatedMap = new Map(prevTokens.map(t => [t.token_address, t]));
                update.tokens.forEach(token => {
                    updatedMap.set(token.token_address, token);
                });
                return Array.from(updatedMap.values());
            });
            setLastUpdate(update.timestamp);
        });

        socketInstance.on('volume_spike', (update: WebSocketUpdate) => {
            console.log('📈 Volume spikes detected:', update.tokens.length);
            // Update specific tokens that had volume spikes
            setTokens(prevTokens => {
                const updatedMap = new Map(prevTokens.map(t => [t.token_address, t]));
                update.tokens.forEach(token => {
                    updatedMap.set(token.token_address, token);
                });
                return Array.from(updatedMap.values());
            });
            setLastUpdate(update.timestamp);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [url]);

    const requestInitialData = useCallback(() => {
        if (socket && isConnected) {
            socket.emit('request_initial_data');
        }
    }, [socket, isConnected]);

    return {
        socket,
        isConnected,
        tokens,
        lastUpdate,
        requestInitialData,
    };
};
