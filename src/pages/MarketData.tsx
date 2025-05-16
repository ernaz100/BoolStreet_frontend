import React from 'react';
import { Box, Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';

// Mock data for market overview
const marketOverview = [
    { name: 'S&P 500', value: '4,783.45', change: '+1.2%', trend: 'up' },
    { name: 'NASDAQ', value: '16,742.38', change: '+0.8%', trend: 'up' },
    { name: 'DOW', value: '38,654.42', change: '-0.3%', trend: 'down' },
    { name: 'VIX', value: '15.23', change: '-2.1%', trend: 'down' },
];

// Mock data for top movers
const topMovers = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '175.04', change: '+2.3%', volume: '45.2M' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '415.32', change: '+1.8%', volume: '28.7M' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '142.56', change: '-1.2%', volume: '15.4M' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '178.75', change: '+3.1%', volume: '32.1M' },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: '485.58', change: '+4.2%', volume: '22.3M' },
];

const MarketData: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Market Data
            </Typography>

            {/* Market Overview */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                {marketOverview.map((market) => (
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

            {/* Top Movers */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Top Movers
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Change</TableCell>
                            <TableCell align="right">Volume</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {topMovers.map((stock) => (
                            <TableRow key={stock.symbol}>
                                <TableCell component="th" scope="row">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ShowChart sx={{ mr: 1, color: 'primary.main' }} />
                                        {stock.symbol}
                                    </Box>
                                </TableCell>
                                <TableCell>{stock.name}</TableCell>
                                <TableCell align="right">{stock.price}</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{
                                        color: stock.change.startsWith('+') ? 'success.main' : 'error.main',
                                        fontWeight: 600,
                                    }}
                                >
                                    {stock.change}
                                </TableCell>
                                <TableCell align="right">{stock.volume}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default MarketData; 