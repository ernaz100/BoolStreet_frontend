import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, Typography, Card, CardContent, CircularProgress, Alert, AlertTitle, Button, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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

const MarketData: React.FC = () => {
    // State for market data
    const [marketOverview, setMarketOverview] = useState<MarketOverview[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData>({});
    const [selectedCoins, setSelectedCoins] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Fetch market data
    const fetchMarketData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch market overview
            const overviewResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/market/top-movers`);
            if (overviewResponse.status === 401) {
                logout();
                navigate('/');
                return;
            }
            const overview = overviewResponse.data;
            setMarketOverview(overview);

            // Fetch 24-hour history with 15-minute intervals
            const historyResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/market/history/24h`);
            setHistoryData(historyResponse.data);
        } catch (err) {
            setError('Unable to fetch market data. This could be due to a temporary service disruption or network issue.');
            console.error('Error fetching market data:', err);
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    // Initialize selected coins when market overview is loaded (default to first coin only)
    useEffect(() => {
        if (marketOverview.length > 0 && selectedCoins.size === 0) {
            const coins = new Set([marketOverview[0].name]);
            setSelectedCoins(coins);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketOverview]);

    useEffect(() => {
        fetchMarketData();
        // Refresh data every 15 minutes for 24-hour chart
        const interval = setInterval(fetchMarketData, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchMarketData]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
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
                            onClick={fetchMarketData}
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
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Coin Movement Today
            </Typography>

            {/* Top Movers - 6 boxes in one row */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
                gap: 2,
                mb: 4
            }}>
                {[...marketOverview].sort((a, b) => {
                    // Parse value strings to numbers (remove $, commas, and convert to number)
                    const valueA = parseFloat(a.value.replace(/[$,]/g, '')) || 0;
                    const valueB = parseFloat(b.value.replace(/[$,]/g, '')) || 0;
                    return valueB - valueA; // Descending order
                }).map((market) => (
                    <Card
                        key={market.name}
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {market.name}
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                                {market.value}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {market.trend === 'up' ? (
                                    <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                    <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                                )}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: market.trend === 'up' ? 'success.main' : 'error.main',
                                        fontWeight: 600,
                                    }}
                                >
                                    {market.change}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* 24-Hour Price Chart with 15-minute intervals */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                24-Hour Price Movement
            </Typography>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', p: 3 }}>
                {/* Coin Toggle Checkboxes */}
                <Box sx={{ mb: 3 }}>
                    <FormGroup row>
                        {marketOverview.map((market) => (
                            <FormControlLabel
                                key={market.name}
                                control={
                                    <Checkbox
                                        checked={selectedCoins.has(market.name)}
                                        onChange={(e) => {
                                            const newSelected = new Set(selectedCoins);
                                            if (e.target.checked) {
                                                newSelected.add(market.name);
                                            } else {
                                                newSelected.delete(market.name);
                                            }
                                            setSelectedCoins(newSelected);
                                        }}
                                    />
                                }
                                label={market.name}
                            />
                        ))}
                    </FormGroup>
                </Box>

                {/* Chart */}
                {Object.keys(historyData).length > 0 && (
                    <Box sx={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={(() => {
                                    // Transform history data into chart format
                                    const chartData: { [key: string]: any }[] = [];
                                    const timestamps = new Set<string>();

                                    // Collect all unique timestamps
                                    Object.values(historyData).forEach((coinData) => {
                                        coinData.forEach((point) => {
                                            timestamps.add(point.timestamp);
                                        });
                                    });

                                    // Create data points for each timestamp
                                    Array.from(timestamps)
                                        .sort()
                                        .forEach((timestamp) => {
                                            const point: { [key: string]: any } = { timestamp };
                                            Object.entries(historyData).forEach(([symbol, coinData]) => {
                                                if (selectedCoins.has(symbol)) {
                                                    const matchingPoint = coinData.find(
                                                        (p) => p.timestamp === timestamp
                                                    );
                                                    if (matchingPoint) {
                                                        point[symbol] = matchingPoint.price;
                                                    }
                                                }
                                            });
                                            chartData.push(point);
                                        });

                                    return chartData;
                                })()}
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
                                        // If only one coin is selected, zoom in on its price range
                                        if (selectedCoins.size === 1) {
                                            const selectedSymbol = Array.from(selectedCoins)[0];
                                            const coinData = historyData[selectedSymbol];
                                            if (coinData && coinData.length > 0) {
                                                const prices = coinData.map((p) => p.price);
                                                const minPrice = Math.min(...prices);
                                                const maxPrice = Math.max(...prices);
                                                const range = maxPrice - minPrice;
                                                // Add 10% padding on top and bottom
                                                const padding = range * 0.1;
                                                return [
                                                    Math.max(0, minPrice - padding),
                                                    maxPrice + padding,
                                                ];
                                            }
                                        }
                                        // For multiple coins, use auto domain
                                        return ['auto', 'auto'];
                                    })()}
                                    tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => [
                                        `$${value.toLocaleString(undefined, { maximumFractionDigits: 5 })}`,
                                        name,
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
                                <Legend />
                                {Array.from(selectedCoins).map((symbol, index) => {
                                    const colors = [
                                        '#1976d2',
                                        '#d32f2f',
                                        '#388e3c',
                                        '#f57c00',
                                        '#7b1fa2',
                                        '#c2185b',
                                    ];
                                    return (
                                        <Line
                                            key={symbol}
                                            type="monotone"
                                            dataKey={symbol}
                                            stroke={colors[index % colors.length]}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    );
                                })}
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </Card>
        </Container>
    );
};

export default MarketData; 