import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Box,
    Tabs,
    Tab,
    CircularProgress,
} from '@mui/material';
import { CurrencyBitcoin } from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import axios from 'axios';



interface PriceData {
    date: string;
    price: number;
}

const StockChart: React.FC = () => {
    const [stockData, setStockData] = useState<PriceData[]>([]);
    const [timeframe, setTimeframe] = useState(1); // 0: 1W, 1: 1M, 2: 3M
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBTCData = async () => {
            try {
                setLoading(true);
                setError(null);

                const timeframeMap = ['1W', '1M', '3M'];
                const timeframeParam = timeframeMap[timeframe];

                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/market/btc/history?timeframe=${timeframeParam}`
                );

                // Transform data to match chart format
                const transformedData = response.data.map((item: PriceData) => ({
                    date: item.date,
                    price: parseFloat(item.price.toFixed(2)),
                }));

                setStockData(transformedData);
            } catch (err) {
                console.error('Error fetching BTC data:', err);
                setError('Failed to load BTC price data');
                setStockData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBTCData();
    }, [timeframe]);

    const handleTimeframeChange = (event: React.SyntheticEvent, newValue: number) => {
        setTimeframe(newValue);
    };

    const getCurrentPrice = () => stockData[stockData.length - 1]?.price || 0;
    const getPriceChange = () => {
        if (stockData.length <= 1) return { value: 0, percentage: 0 };
        const startPrice = Number(stockData[0].price);
        const endPrice = Number(stockData[stockData.length - 1].price);
        const change = endPrice - startPrice;
        const percentage = (change / startPrice) * 100;
        return { value: change, percentage };
    };

    const priceChange = getPriceChange();

    return (
        <Card sx={{ width: '100%' }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CurrencyBitcoin sx={{ fontSize: 28, color: '#f7931a' }} />
                            <Typography variant="h6">BTC Historical Price</Typography>
                        </Box>
                        <Tabs value={timeframe} onChange={handleTimeframeChange}>
                            <Tab label="1W" />
                            <Tab label="1M" />
                            <Tab label="3M" />
                        </Tabs>
                    </Box>
                }
            />
            <CardContent>
                {loading ? (
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                ) : (
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={stockData}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 10,
                                    bottom: 5,
                                }}
                            >
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    interval={Math.floor(stockData.length / 6)}
                                    minTickGap={30}
                                />
                                <YAxis domain={['auto', 'auto']} />
                                <Tooltip
                                    formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                )}
                {!loading && !error && stockData.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                            Current: <Typography component="span" sx={{ fontWeight: 'medium' }}>${Number(getCurrentPrice()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Change:
                            <Typography
                                component="span"
                                sx={{
                                    fontWeight: 'medium',
                                    color: priceChange.value >= 0 ? 'success.main' : 'error.main',
                                }}
                            >
                                {priceChange.value >= 0 ? '+' : ''}
                                ${priceChange.value.toFixed(2)} ({priceChange.percentage.toFixed(2)}%)
                            </Typography>
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default StockChart; 