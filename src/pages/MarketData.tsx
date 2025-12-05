import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Container, Typography, Card, CardContent, CircularProgress, Alert, AlertTitle, Button, Collapse, IconButton, Chip } from '@mui/material';
import { TrendingUp, TrendingDown, Refresh, Close, Schedule } from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Define interfaces for our data types
interface MarketOverview {
    name: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
}

interface PriceHistory {
    timestamp: string;
    price: number;
}

interface HistoryData {
    [symbol: string]: PriceHistory[];
}

// All tradeable coins - matching backend config
const TRADEABLE_COINS = [
    { ticker: 'BTC', name: 'Bitcoin' },
    { ticker: 'ETH', name: 'Ethereum' },
    { ticker: 'SOL', name: 'Solana' },
    { ticker: 'DOGE', name: 'Dogecoin' },
    { ticker: 'XRP', name: 'Ripple' },
    { ticker: 'BNB', name: 'Binance Coin' },
    { ticker: 'ARB', name: 'Arbitrum' },
    { ticker: 'AVAX', name: 'Avalanche' },
    { ticker: 'LINK', name: 'Chainlink' },
    { ticker: 'MATIC', name: 'Polygon' },
];

const MarketData: React.FC = () => {
    // State for market data
    const [marketOverview, setMarketOverview] = useState<MarketOverview[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData>({});
    const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load cached data (instant)
    const loadCachedData = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/market/cached`);
            if (response.status === 401) {
                logout();
                navigate('/');
                return false;
            }

            const data = response.data;
            if (data.overview && data.overview.length > 0) {
                setMarketOverview(data.overview);
                setHistoryData(data.history || {});
                if (data.updated_at) {
                    setLastUpdated(new Date(data.updated_at));
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error loading cached data:', err);
            return false;
        }
    }, [logout, navigate]);

    // Refresh data from APIs
    const refreshData = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) {
                setRefreshing(true);
            }
            setError(null);

            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/market/refresh`);
            if (response.status === 401) {
                logout();
                navigate('/');
                return;
            }

            const data = response.data;
            setMarketOverview(data.overview || []);
            setHistoryData(data.history || {});
            if (data.updated_at) {
                setLastUpdated(new Date(data.updated_at));
            }
        } catch (err) {
            // Don't show error on background refresh, just log it
            console.error('Error refreshing market data:', err);
            if (showLoading) {
                setError('Unable to refresh market data. Using cached data.');
            }
        } finally {
            if (showLoading) {
                setRefreshing(false);
            }
        }
    }, [logout, navigate]);

    // Initial load: cached first, then refresh
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);

            // First, try to load cached data for instant display
            const hasCachedData = await loadCachedData();

            // If we have cached data, show it immediately
            if (hasCachedData) {
                setLoading(false);
                // Then refresh in background
                refreshData(false);
            } else {
                // No cached data, do a full refresh
                await refreshData(true);
                setLoading(false);
            }
        };

        initializeData();

        // Set up refresh interval (every 60 seconds)
        refreshIntervalRef.current = setInterval(() => {
            refreshData(false);
        }, 60 * 1000);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [loadCachedData, refreshData]);

    // Get market data for a specific coin
    const getCoinData = (ticker: string): MarketOverview | undefined => {
        return marketOverview.find(m => m.name === ticker);
    };

    // Handle coin card click
    const handleCoinClick = (ticker: string) => {
        if (selectedCoin === ticker) {
            setSelectedCoin(null);
        } else {
            setSelectedCoin(ticker);
        }
    };

    // Handle manual refresh
    const handleManualRefresh = () => {
        refreshData(true);
    };

    // Format last updated time
    const formatLastUpdated = () => {
        if (!lastUpdated) return 'Never';
        const now = new Date();
        const diffMs = now.getTime() - lastUpdated.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;

        return lastUpdated.toLocaleTimeString();
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error && marketOverview.length === 0) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        '& .MuiAlert-message': {
                            width: '100%'
                        }
                    }}
                >
                    <AlertTitle>Market Data Unavailable</AlertTitle>
                    {error}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Refresh />}
                            onClick={handleManualRefresh}
                            sx={{ mt: 1 }}
                        >
                            Retry
                        </Button>
                    </Box>
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header with refresh button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Tradeable Coins
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        icon={<Schedule sx={{ fontSize: 16 }} />}
                        label={`Updated ${formatLastUpdated()}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>
            </Box>

            {/* Error banner (non-blocking) */}
            {error && (
                <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Coin Cards Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: 2,
                mb: 3
            }}>
                {TRADEABLE_COINS.map((coin) => {
                    const data = getCoinData(coin.ticker);
                    const isSelected = selectedCoin === coin.ticker;

                    return (
                        <Card
                            key={coin.ticker}
                            elevation={0}
                            onClick={() => handleCoinClick(coin.ticker)}
                            sx={{
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: isSelected ? 'primary.main' : 'divider',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                bgcolor: isSelected ? 'primary.50' : 'background.paper',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 2,
                                },
                            }}
                        >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {coin.name}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {coin.ticker}
                                </Typography>
                                {data ? (
                                    <>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {data.value}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            {data.trend === 'up' ? (
                                                <TrendingUp sx={{ color: 'success.main', fontSize: 18, mr: 0.5 }} />
                                            ) : (
                                                <TrendingDown sx={{ color: 'error.main', fontSize: 18, mr: 0.5 }} />
                                            )}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: data.trend === 'up' ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {data.change}
                                            </Typography>
                                        </Box>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Loading...
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            {/* 24-Hour Price Chart - Collapsible */}
            <Collapse in={selectedCoin !== null}>
                {selectedCoin && (
                    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {selectedCoin} - 24 Hour Price Movement
                            </Typography>
                            <IconButton onClick={() => setSelectedCoin(null)} size="small">
                                <Close />
                            </IconButton>
                        </Box>

                        {/* Chart */}
                        {historyData[selectedCoin] && historyData[selectedCoin].length > 0 ? (
                            <Box sx={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={historyData[selectedCoin]}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return date.toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                });
                                            }}
                                        />
                                        <YAxis
                                            domain={(() => {
                                                const coinData = historyData[selectedCoin];
                                                if (coinData && coinData.length > 0) {
                                                    const prices = coinData.map((p) => p.price);
                                                    const minPrice = Math.min(...prices);
                                                    const maxPrice = Math.max(...prices);
                                                    const range = maxPrice - minPrice;
                                                    const padding = range * 0.1;
                                                    return [
                                                        Math.max(0, minPrice - padding),
                                                        maxPrice + padding,
                                                    ];
                                                }
                                                return ['auto', 'auto'];
                                            })()}
                                            tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [
                                                `$${value.toLocaleString(undefined, { maximumFractionDigits: 5 })}`,
                                                selectedCoin,
                                            ]}
                                            labelFormatter={(label) => {
                                                const date = new Date(label);
                                                return date.toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                });
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#1976d2"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    No historical data available for {selectedCoin}
                                </Typography>
                            </Box>
                        )}
                    </Card>
                )}
            </Collapse>
        </Container>
    );
};

export default MarketData;
