import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, AlertTitle, Button } from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart, Refresh } from '@mui/icons-material';
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

interface TopMover {
    symbol: string;
    name: string;
    price: string;
    change: string;
    volume: string;
}

const MarketData: React.FC = () => {
    // State for market data
    const [marketOverview, setMarketOverview] = useState<MarketOverview[]>([]);
    const [topMovers, setTopMovers] = useState<TopMover[]>([]);
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
            const overviewResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/market/overview`);
            if (overviewResponse.status === 401) {
                logout();
                navigate('/');
                return;
            }
            setMarketOverview(overviewResponse.data);

            // Fetch top movers
            const moversResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/market/top-movers`);
            setTopMovers(moversResponse.data);
        } catch (err) {
            setError('Unable to fetch market data. This could be due to a temporary service disruption or network issue.');
            console.error('Error fetching market data:', err);
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => {
        fetchMarketData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000);

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