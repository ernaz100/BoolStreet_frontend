import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    VpnKey,
    TrendingUp,
    ArrowForward,
    AutoGraph,
} from '@mui/icons-material';
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
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Utility function to get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

interface BrokerConnection {
    id: number;
    exchange: string;
    api_key: string;
    api_secret: string;
    is_connected: boolean;
    connection_status: 'connected' | 'disconnected' | 'error';
    created_at: string;
    last_verified?: string;
}

interface Trader {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    balance: number;
    tickers: string;
}

interface PerformanceData {
    date: string;
    balance: number;
    profit: number;
}

const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

    // Fetch broker connections
    const fetchBrokerConnections = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/brokers/connections`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            setBrokerConnections(response.data.connections || []);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            // Don't set error for broker fetch failure, just use empty array
            setBrokerConnections([]);
        }
    }, [logout, navigate]);

    // Fetch performance data (mock for now)
    const fetchPerformanceData = useCallback(async (activeTraders: Trader[]) => {
        try {
            // TODO: Replace with actual API call
            // const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/dashboard/performance`, {
            //     headers: {
            //         Authorization: `Bearer ${getToken()}`,
            //     },
            // });
            // setPerformanceData(response.data.performance || []);

            // Mock performance data for demonstration
            const mockData: PerformanceData[] = [];
            const today = new Date();
            const initialBalance = activeTraders.reduce((sum, t) => sum + t.balance, 0);

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const variation = (Math.random() - 0.5) * 2000; // Random variation
                const balance = initialBalance + (6 - i) * 100 + variation;
                mockData.push({
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    balance: Math.max(0, balance),
                    profit: balance - initialBalance,
                });
            }
            setPerformanceData(mockData);
        } catch (err: any) {
            console.error('Failed to fetch performance data:', err);
            setPerformanceData([]);
        }
    }, []);

    // Fetch traders
    const fetchTraders = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/models/list`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });
            const fetchedTraders = response.data.models || [];
            setTraders(fetchedTraders);

            // Filter active traders
            const activeTraders = fetchedTraders.filter((t: Trader) => t.active);

            // If there are active traders, fetch performance data
            if (activeTraders.length > 0) {
                fetchPerformanceData(activeTraders);
            } else {
                setPerformanceData([]);
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            setTraders([]);
        }
    }, [logout, navigate, fetchPerformanceData]);

    // Fetch all data on mount
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([fetchBrokerConnections(), fetchTraders()]);
            } catch (err: any) {
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [fetchBrokerConnections, fetchTraders]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    const hasBrokerConnections = brokerConnections.length > 0;
    const activeTraders = traders.filter((t) => t.active);
    const hasActiveTraders = activeTraders.length > 0;

    // State 1: No API keys
    if (!hasBrokerConnections) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'black' }}>
                    Dashboard
                </Typography>
                <Card
                    sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        py: 6,
                        px: 4,
                    }}
                >
                    <VpnKey sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'black' }}>
                        Connect Your Exchange Account
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                        To start trading, you'll need to connect your crypto exchange account using API keys.
                        Add your broker connection to get started.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<VpnKey />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/brokers')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            borderRadius: 2,
                        }}
                    >
                        Add API Keys
                    </Button>
                </Card>
            </Container>
        );
    }

    // State 2: Has API keys but no active traders
    if (hasBrokerConnections && !hasActiveTraders) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'black' }}>
                    Dashboard
                </Typography>
                <Card
                    sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        textAlign: 'center',
                        py: 6,
                        px: 4,
                    }}
                >
                    <AutoGraph sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'black' }}>
                        Create Your First Trading Agent
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                        You've connected your exchange account! Now create and activate your first trading agent
                        to start trading automatically on the crypto market.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<TrendingUp />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/traders')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            borderRadius: 2,
                        }}
                    >
                        Create Trading Agent
                    </Button>
                </Card>
            </Container>
        );
    }

    // State 3: Has active traders - show performance chart
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: 'black' }}>
                Dashboard
            </Typography>

            {/* Performance Chart */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                        Trading Performance
                    </Typography>
                    {performanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        if (name === 'balance') {
                                            return [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Balance'];
                                        }
                                        return [`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Profit/Loss'];
                                    }}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Balance"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="profit"
                                    stroke="#059669"
                                    strokeWidth={2}
                                    name="Profit/Loss"
                                    strokeDasharray="5 5"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                            <Typography color="text.secondary">Loading performance data...</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Active Traders Summary */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(activeTraders.length, 4)}, 1fr)` },
                    gap: 3,
                }}
            >
                {activeTraders.map((trader) => (
                    <Card key={trader.id} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {trader.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {trader.tickers ? trader.tickers.split(',').slice(0, 2).join(', ') : 'No tickers'}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                ${trader.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default Dashboard;
