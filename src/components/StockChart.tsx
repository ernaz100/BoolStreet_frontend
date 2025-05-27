import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Box,
    Tabs,
    Tab,
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// Sample data generation function
const generateStockData = (days: number, startPrice: number) => {
    const data = [];
    let price = startPrice;

    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.5) * 5;
        price = Math.max(price + change, 1);

        data.push({
            date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            price: price.toFixed(2),
            volume: Math.floor(Math.random() * 10000000),
        });
    }

    return data;
};



const StockChart: React.FC = () => {
    const [stockData, setStockData] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState(1); // 0: 1W, 1: 1M, 2: 3M

    useEffect(() => {
        const days = timeframe === 0 ? 7 : timeframe === 1 ? 30 : 90;
        setStockData(generateStockData(days, 150));
    }, [timeframe]);

    const handleTimeframeChange = (event: React.SyntheticEvent, newValue: number) => {
        setTimeframe(newValue);
    };

    const getCurrentPrice = () => stockData[stockData.length - 1]?.price || '0.00';
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
                        <Box>
                            <Typography variant="h6">AAPL Stock Price</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Historical price data
                            </Typography>
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
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const idx = stockData.findIndex((item) => item.date === value);
                                    return idx % (timeframe === 0 ? 1 : timeframe === 1 ? 5 : 15) === 0 ? value : '';
                                }}
                            />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip
                                formatter={(value) => [`$${value}`, 'Price']}
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
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                        Current: <Typography component="span" sx={{ fontWeight: 'medium' }}>${getCurrentPrice()}</Typography>
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
                            {priceChange.value.toFixed(2)} ({priceChange.percentage.toFixed(2)}%)
                        </Typography>
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StockChart; 