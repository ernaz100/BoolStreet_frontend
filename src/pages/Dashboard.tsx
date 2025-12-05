import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tooltip as MuiTooltip,
    Collapse,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    VpnKey,
    TrendingUp,
    ArrowForward,
    AutoGraph,
    CheckCircle,
    Error,
    PlayArrow,
    AccountBalance,
    ExpandMore,
    ExpandLess,
    Visibility,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
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

interface SpotBalance {
    coin: string;
    total: number;
    available: number;
    hold: number;
    price: number;
    value: number;
}

interface PerpPosition {
    coin: string;
    size: number;
    side: string;
    entry_price: number;
    current_price: number;
    unrealized_pnl: number;
    value: number;
}

interface BrokerBalance {
    id: number;
    exchange: string;
    is_testnet: boolean;
    total_value: number | null;
    available_balance: number | null;
    perps_margin: number | null;
    spot_balances: SpotBalance[];
    perp_positions: PerpPosition[];
    error: string | null;
    main_wallet_address?: string;
}

interface Trader {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    balance: number;
    tickers: string;
}

interface Position {
    coin: string;
    total_quantity: number;
    total_value: number;
    avg_price: number;
    long_count: number;
    short_count: number;
    hold_count: number;
    last_trade: string | null;
}

interface BalanceHistoryPoint {
    date: string;
    balance: number;
    timestamp: string;
}

interface TradeMarker {
    id: number;
    trader_id: number;
    coin: string;
    side: string;
    quantity: number;
    price: number;
    timestamp: string;
    date: string;
}

interface Trade {
    id: number;
    trader_id: number;
    trader_name: string;
    symbol: string;
    coin: string;
    side: string;
    quantity: number;
    price: number;
    uncertainty: number | null;
    order_id: string | null;
    success: boolean;
    error_message: string | null;
    executed_at: string;
    stop_loss_pct: number | null;
    take_profit_pct: number | null;
    leverage: number | null;
    stop_loss_order: {
        success: boolean;
        trigger_price: number;
        percentage: number;
        order_id?: string;
        error?: string;
    } | null;
    take_profit_order: {
        success: boolean;
        trigger_price: number;
        percentage: number;
        order_id?: string;
        error?: string;
    } | null;
}

interface APICallLog {
    id: number;
    trader_id: number;
    trader_name: string;
    model_name: string;
    prompt: string | null;
    prompt_length: number | null;
    response: string;
    decision_coin: string | null;
    decision_action: string | null;
    decision_uncertainty: number | null;
    decision_quantity: number | null;
    tokens_used: number | null;
    latency_ms: number | null;
    success: boolean;
    error_message: string | null;
    created_at: string;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

const Dashboard: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
    const [traders, setTraders] = useState<Trader[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [apiLogs, setApiLogs] = useState<APICallLog[]>([]);
    const [executing, setExecuting] = useState(false);
    const [executeMessage, setExecuteMessage] = useState<string | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryPoint[]>([]);
    const [tradeMarkers, setTradeMarkers] = useState<TradeMarker[]>([]);
    const [brokerBalances, setBrokerBalances] = useState<BrokerBalance[]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // UI state for collapsible sections
    const [tradesExpanded, setTradesExpanded] = useState(false);
    const [apiLogsExpanded, setApiLogsExpanded] = useState(false);
    const [selectedApiLog, setSelectedApiLog] = useState<APICallLog | null>(null);

    // Refs for comparing data to avoid unnecessary re-renders
    const prevBalanceHistoryRef = useRef<string>('');

    // Helper to check if balance history has actually changed
    const hasBalanceHistoryChanged = useCallback((newHistory: BalanceHistoryPoint[]): boolean => {
        const newHistoryStr = JSON.stringify(newHistory.map(h => ({ date: h.date, balance: Math.round(h.balance * 100) / 100 })));
        if (newHistoryStr === prevBalanceHistoryRef.current) {
            return false;
        }
        prevBalanceHistoryRef.current = newHistoryStr;
        return true;
    }, []);

    // Apply cached data to state
    const applyCachedData = useCallback((data: any) => {
        if (data.broker_balances) {
            setBrokerBalances(data.broker_balances);
            // Extract positions from broker balances
            const allPositions: Position[] = [];
            data.broker_balances.forEach((broker: any) => {
                if (broker.perp_positions) {
                    broker.perp_positions.forEach((pos: any) => {
                        allPositions.push({
                            ...pos,
                            broker: broker.exchange
                        });
                    });
                }
            });
            setPositions(allPositions);
        }
        if (data.trades) setTrades(data.trades);
        if (data.api_logs) setApiLogs(data.api_logs);
        if (data.traders) setTraders(data.traders);
        // Only update balance history if data has changed to prevent chart flickering
        if (data.balance_history && hasBalanceHistoryChanged(data.balance_history)) {
            setBalanceHistory(data.balance_history);
        }
    }, [hasBalanceHistoryChanged]);

    // Fetch cached dashboard data (instant load)
    const fetchCachedData = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/dashboard/cached`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });

            if (response.data.cached && response.data.data) {
                applyCachedData(response.data.data);
                if (response.data.updated_at) {
                    setLastUpdated(new Date(response.data.updated_at));
                }
                return true;
            }
            return false;
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            }
            return false;
        }
    }, [logout, navigate, applyCachedData]);

    // Fetch broker connections (needed for initial state check)
    const fetchBrokerConnections = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/brokers/connections`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            setBrokerConnections(response.data.connections || []);
            return response.data.connections || [];
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            }
            setBrokerConnections([]);
            return [];
        }
    }, [logout, navigate]);

    // Refresh all dashboard data from backend (updates cache)
    const refreshDashboardData = useCallback(async (isBackground = false) => {
        if (!isBackground) setRefreshing(true);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/refresh`,
                {},
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (response.data.success && response.data.data) {
                applyCachedData(response.data.data);
                setLastUpdated(new Date());
            }

            // Also fetch balance history separately (more detailed)
            try {
                const historyResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/dashboard/balance-history`,
                    {
                        headers: { Authorization: `Bearer ${getToken()}` },
                        params: { days: 7 }
                    }
                );
                const newHistory = historyResponse.data.history || [];
                // Only update if data has actually changed to prevent chart flickering
                if (hasBalanceHistoryChanged(newHistory)) {
                    setBalanceHistory(newHistory);
                }
                setTradeMarkers(historyResponse.data.trades || []);
            } catch (historyErr) {
                console.error('Failed to fetch balance history:', historyErr);
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            if (!isBackground) {
                setError('Failed to refresh dashboard data');
            }
            console.error('Failed to refresh dashboard:', err);
        } finally {
            if (!isBackground) setRefreshing(false);
        }
    }, [logout, navigate, applyCachedData, hasBalanceHistoryChanged]);

    // Initial load: cache first, then refresh
    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch broker connections first (needed for UI state)
                const connections = await fetchBrokerConnections();

                // 2. Try to load cached data for instant display
                const hasCached = await fetchCachedData();

                // 3. If we have cached data, show it immediately
                if (hasCached) {
                    setLoading(false);
                    // Then refresh in background
                    refreshDashboardData(true);
                } else if (connections.length > 0) {
                    // No cache but has connections - do full refresh
                    await refreshDashboardData(false);
                    setLoading(false);
                } else {
                    // No connections - just stop loading
                    setLoading(false);
                }
            } catch (err: any) {
                setError('Failed to load dashboard data');
                setLoading(false);
            }
        };

        initDashboard();
    }, [fetchBrokerConnections, fetchCachedData, refreshDashboardData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (brokerConnections.length > 0) {
                refreshDashboardData(true);
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [brokerConnections.length, refreshDashboardData]);

    // Memoize chart data to prevent recalculation and flickering on every render
    // Must be called before any conditional returns (React hooks rules)
    const chartData = useMemo(() => {
        return balanceHistory.map(point => ({
            ...point,
            trades: tradeMarkers.filter(t => t.date === point.date)
        }));
    }, [balanceHistory, tradeMarkers]);

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

    // State 2: Has API keys but no active traders - show full dashboard
    if (hasBrokerConnections && !hasActiveTraders) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'black' }}>
                            Dashboard
                        </Typography>
                        {refreshing && (
                            <CircularProgress size={20} sx={{ color: 'grey.400' }} />
                        )}
                        {lastUpdated && !refreshing && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                Updated {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => refreshDashboardData(false)}
                            disabled={refreshing}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {/* No Active Traders Notice */}
                <Alert
                    severity="info"
                    sx={{ mb: 3, borderRadius: 2 }}
                    action={
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TrendingUp />}
                            onClick={() => navigate('/traders')}
                            sx={{ ml: 1 }}
                        >
                            Create Trader
                        </Button>
                    }
                >
                    <Typography variant="body2">
                        <strong>No active trading agents.</strong> Your portfolio is visible below, but no automated trading is currently running.
                    </Typography>
                </Alert>

                {/* Portfolio Overview - Main Section */}
                {brokerBalances.length > 0 && (
                    <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 4 }}>
                            {brokerBalances.map((broker) => (
                                <Box key={broker.id}>
                                    {broker.error ? (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {broker.error}
                                        </Alert>
                                    ) : (
                                        <>
                                            {/* Portfolio Header with Total Value */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                                <Box>
                                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                                        Portfolio Value
                                                    </Typography>
                                                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'black' }}>
                                                        ${broker.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Chip
                                                            label={broker.exchange.toUpperCase()}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                        {broker.is_testnet && (
                                                            <Chip label="Testnet" size="small" color="warning" />
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                                        Available to Trade
                                                    </Typography>
                                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                        ${broker.available_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Open Positions - Prominent Display */}
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'black' }}>
                                                    Open Positions
                                                </Typography>
                                                {broker.perp_positions.length > 0 ? (
                                                    <TableContainer>
                                                        <Table size="medium">
                                                            <TableHead>
                                                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                                    <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                                                                    <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Size</TableCell>
                                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Entry Price</TableCell>
                                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Current Price</TableCell>
                                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Position Value</TableCell>
                                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Unrealized P&L</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {broker.perp_positions.map((pos, idx) => {
                                                                    const pnlPercent = pos.entry_price > 0
                                                                        ? ((pos.current_price - pos.entry_price) / pos.entry_price * 100 * (pos.side === 'long' ? 1 : -1))
                                                                        : 0;
                                                                    return (
                                                                        <TableRow key={`${pos.coin}-${idx}`} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                                                            <TableCell>
                                                                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                                    {pos.coin}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Chip
                                                                                    label={pos.side.toUpperCase()}
                                                                                    size="small"
                                                                                    color={pos.side === 'long' ? 'success' : 'error'}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell align="right">
                                                                                {Math.abs(pos.size).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                                            </TableCell>
                                                                            <TableCell align="right">
                                                                                ${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </TableCell>
                                                                            <TableCell align="right">
                                                                                ${pos.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </TableCell>
                                                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                                                ${pos.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </TableCell>
                                                                            <TableCell align="right">
                                                                                <Box>
                                                                                    <Typography
                                                                                        variant="body1"
                                                                                        sx={{
                                                                                            fontWeight: 700,
                                                                                            color: pos.unrealized_pnl >= 0 ? 'success.main' : 'error.main',
                                                                                        }}
                                                                                    >
                                                                                        {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                    </Typography>
                                                                                    <Typography
                                                                                        variant="caption"
                                                                                        sx={{
                                                                                            color: pnlPercent >= 0 ? 'success.main' : 'error.main',
                                                                                        }}
                                                                                    >
                                                                                        ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                                                    </Typography>
                                                                                </Box>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                ) : (
                                                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                        <Typography color="text.secondary">
                                                            No open positions. Execute a trade to open a position.
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Spot Balances (if any) */}
                                            {broker.spot_balances.length > 0 && (
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                                                        Spot Holdings
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                        {broker.spot_balances.map((balance) => (
                                                            <Box
                                                                key={balance.coin}
                                                                sx={{
                                                                    p: 2,
                                                                    borderRadius: 2,
                                                                    bgcolor: 'grey.50',
                                                                    border: '1px solid',
                                                                    borderColor: 'grey.200',
                                                                    minWidth: 140,
                                                                }}
                                                            >
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                    {balance.coin}
                                                                </Typography>
                                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                    {balance.total.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    ≈ ${balance.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Portfolio Value History Chart */}
                <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                            Portfolio Value Over Time
                        </Typography>
                        {balanceHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <defs>
                                        <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                                        width={70}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const dayTrades = data.trades || [];

                                                // Simple tooltip for days without trades
                                                if (dayTrades.length === 0) {
                                                    return (
                                                        <div style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                            padding: '10px 14px',
                                                        }}>
                                                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
                                                                Portfolio: ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Sort trades by timestamp within the day
                                                const sortedDayTrades = [...dayTrades].sort((a, b) =>
                                                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                                );

                                                // Full tooltip for days with trades
                                                return (
                                                    <div style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '10px',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                        padding: '14px 18px',
                                                        minWidth: '200px',
                                                    }}>
                                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                                            {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                                                            Portfolio: ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                                                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                Trades Executed
                                                            </div>
                                                            {sortedDayTrades.map((trade: TradeMarker, idx: number) => (
                                                                <div key={idx} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    marginBottom: idx < sortedDayTrades.length - 1 ? '6px' : '0',
                                                                    padding: '8px 10px',
                                                                    backgroundColor: trade.side === 'long' ? '#ecfdf5' : trade.side === 'short' ? '#fef2f2' : '#f9fafb',
                                                                    borderRadius: '6px',
                                                                }}>
                                                                    <span style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        color: trade.side === 'long' ? '#10b981' : trade.side === 'short' ? '#ef4444' : '#6b7280',
                                                                        textTransform: 'uppercase',
                                                                        padding: '2px 6px',
                                                                        backgroundColor: trade.side === 'long' ? '#d1fae5' : trade.side === 'short' ? '#fee2e2' : '#f3f4f6',
                                                                        borderRadius: '4px',
                                                                    }}>
                                                                        {trade.side}
                                                                    </span>
                                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                                                                        {trade.coin}
                                                                    </span>
                                                                    <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>
                                                                        {trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} @ ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#3b82f6"
                                        strokeWidth={2.5}
                                        dot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            const hasTrades = payload.trades && payload.trades.length > 0;
                                            if (hasTrades) {
                                                return (
                                                    <circle
                                                        cx={cx}
                                                        cy={cy}
                                                        r={6}
                                                        fill={payload.trades[0].side === 'long' ? '#10b981' : '#ef4444'}
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                );
                                            }
                                            return <circle cx={cx} cy={cy} r={0} />;
                                        }}
                                        activeDot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            const hasTrades = payload.trades && payload.trades.length > 0;
                                            if (hasTrades) {
                                                return (
                                                    <circle
                                                        cx={cx}
                                                        cy={cy}
                                                        r={8}
                                                        fill={payload.trades[0].side === 'long' ? '#10b981' : '#ef4444'}
                                                        stroke="#fff"
                                                        strokeWidth={3}
                                                    />
                                                );
                                            }
                                            return <circle cx={cx} cy={cy} r={0} />;
                                        }}
                                        fill="url(#portfolioGradient)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography color="text.secondary">No portfolio history yet</Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Trades - Show 5, expandable */}
                <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'black' }}>
                                Recent Trades
                            </Typography>
                            {trades.length > 5 && (
                                <Button
                                    size="small"
                                    onClick={() => setTradesExpanded(!tradesExpanded)}
                                    endIcon={tradesExpanded ? <ExpandLess /> : <ExpandMore />}
                                >
                                    {tradesExpanded ? 'Show Less' : `Show All (${trades.length})`}
                                </Button>
                            )}
                        </Box>
                        {trades.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Coin</TableCell>
                                            <TableCell>Side</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(tradesExpanded ? trades : trades.slice(0, 5)).map((trade) => {
                                            const totalValue = trade.quantity * trade.price;
                                            return (
                                                <TableRow key={trade.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                        {new Date(trade.executed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={trade.coin} size="small" color="primary" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.side.toUpperCase()}
                                                            size="small"
                                                            color={trade.side === 'long' ? 'success' : trade.side === 'short' ? 'error' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: trade.side === 'long' ? 'success.main' : trade.side === 'short' ? 'error.main' : 'text.primary' }}>
                                                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {trade.success ? (
                                                            <CheckCircle color="success" fontSize="small" />
                                                        ) : (
                                                            <MuiTooltip title={trade.error_message || 'Trade failed'}>
                                                                <Error color="error" fontSize="small" />
                                                            </MuiTooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Typography color="text.secondary">No trades yet</Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* API Call Logs - Fully Collapsible */}
                <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'grey.50' },
                            }}
                            onClick={() => setApiLogsExpanded(!apiLogsExpanded)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'black' }}>
                                    API Call Logs
                                </Typography>
                                {apiLogs.length > 0 && (
                                    <Chip label={apiLogs.length} size="small" color="default" />
                                )}
                            </Box>
                            <IconButton size="small">
                                {apiLogsExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </Box>
                        <Collapse in={apiLogsExpanded}>
                            <Box sx={{ px: 2, pb: 2 }}>
                                {apiLogs.length > 0 ? (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Time</TableCell>
                                                    <TableCell>Model</TableCell>
                                                    <TableCell>Decision</TableCell>
                                                    <TableCell align="right">Tokens</TableCell>
                                                    <TableCell align="right">Latency</TableCell>
                                                    <TableCell align="center">View</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {apiLogs.map((log) => (
                                                    <TableRow
                                                        key={log.id}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: 'primary.50' },
                                                        }}
                                                        onClick={() => setSelectedApiLog(log)}
                                                    >
                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                            {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={log.model_name} size="small" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.decision_action && log.decision_coin ? (
                                                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                                    <Chip
                                                                        label={log.decision_action.toUpperCase()}
                                                                        size="small"
                                                                        color={log.decision_action === 'long' ? 'success' : log.decision_action === 'short' ? 'error' : 'default'}
                                                                    />
                                                                    <Typography variant="body2">{log.decision_coin}</Typography>
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {log.tokens_used ? log.tokens_used.toLocaleString() : '-'}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <IconButton size="small" color="primary">
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <Typography color="text.secondary">No API logs yet</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Collapse>
                    </CardContent>
                </Card>

            </Container>
        );
    }

    // State 3: Has active traders - show performance chart
    const handleExecuteTraders = async () => {
        setExecuting(true);
        setExecuteMessage(null);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/dashboard/execute`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );

            const results = response.data.results || [];
            const successCount = results.filter((r: any) => r.success).length;
            const totalCount = results.length;

            setExecuteMessage(
                `Execution completed: ${successCount}/${totalCount} traders executed successfully`
            );

            // Refresh dashboard data after execution
            setTimeout(() => {
                refreshDashboardData(true);
                setExecuteMessage(null);
            }, 2000);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            setExecuteMessage(err.response?.data?.error || 'Failed to execute traders');
        } finally {
            setExecuting(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'black' }}>
                        Dashboard
                    </Typography>
                    {refreshing && (
                        <CircularProgress size={20} sx={{ color: 'grey.400' }} />
                    )}
                    {lastUpdated && !refreshing && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            Updated {lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => refreshDashboardData(false)}
                        disabled={refreshing}
                        sx={{ minWidth: 'auto', px: 2 }}
                    >
                        Refresh
                    </Button>
                    {hasActiveTraders && (
                        <Button
                            variant="contained"
                            startIcon={executing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                            onClick={handleExecuteTraders}
                            disabled={executing}
                            sx={{
                                px: 3,
                                py: 1.5,
                                fontSize: '1rem',
                                borderRadius: 2,
                            }}
                        >
                            {executing ? 'Executing...' : 'Execute Traders'}
                        </Button>
                    )}
                </Box>
            </Box>

            {executeMessage && (
                <Alert
                    severity={executeMessage.includes('Failed') ? 'error' : 'success'}
                    sx={{ mb: 3 }}
                    onClose={() => setExecuteMessage(null)}
                >
                    {executeMessage}
                </Alert>
            )}

            {/* Portfolio Overview - Main Section */}
            {brokerBalances.length > 0 && (
                <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <CardContent sx={{ p: 4 }}>
                        {brokerBalances.map((broker) => (
                            <Box key={broker.id}>
                                {broker.error ? (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {broker.error}
                                    </Alert>
                                ) : (
                                    <>
                                        {/* Portfolio Header with Total Value */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                            <Box>
                                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                                    Portfolio Value
                                                </Typography>
                                                <Typography variant="h3" sx={{ fontWeight: 800, color: 'black' }}>
                                                    ${broker.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                    <Chip
                                                        label={broker.exchange.toUpperCase()}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    {broker.is_testnet && (
                                                        <Chip label="Testnet" size="small" color="warning" />
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                                    Available to Trade
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    ${broker.available_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Open Positions - Prominent Display */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'black' }}>
                                                Open Positions
                                            </Typography>
                                            {broker.perp_positions.length > 0 ? (
                                                <TableContainer>
                                                    <Table size="medium">
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                                <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Size</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Entry Price</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Current Price</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Position Value</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Unrealized P&L</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {broker.perp_positions.map((pos, idx) => {
                                                                const pnlPercent = pos.entry_price > 0
                                                                    ? ((pos.current_price - pos.entry_price) / pos.entry_price * 100 * (pos.side === 'long' ? 1 : -1))
                                                                    : 0;
                                                                return (
                                                                    <TableRow key={`${pos.coin}-${idx}`} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                                                        <TableCell>
                                                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                                {pos.coin}
                                                                            </Typography>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip
                                                                                label={pos.side.toUpperCase()}
                                                                                size="small"
                                                                                color={pos.side === 'long' ? 'success' : 'error'}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell align="right">
                                                                            {Math.abs(pos.size).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                                        </TableCell>
                                                                        <TableCell align="right">
                                                                            ${pos.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell align="right">
                                                                            ${pos.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                                            ${pos.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell align="right">
                                                                            <Box>
                                                                                <Typography
                                                                                    variant="body1"
                                                                                    sx={{
                                                                                        fontWeight: 700,
                                                                                        color: pos.unrealized_pnl >= 0 ? 'success.main' : 'error.main',
                                                                                    }}
                                                                                >
                                                                                    {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                </Typography>
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    sx={{
                                                                                        color: pnlPercent >= 0 ? 'success.main' : 'error.main',
                                                                                    }}
                                                                                >
                                                                                    ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                                                </Typography>
                                                                            </Box>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                    <Typography color="text.secondary">
                                                        No open positions. Execute a trade to open a position.
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Spot Balances (if any) */}
                                        {broker.spot_balances.length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
                                                    Spot Holdings
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                    {broker.spot_balances.map((balance) => (
                                                        <Box
                                                            key={balance.coin}
                                                            sx={{
                                                                p: 2,
                                                                borderRadius: 2,
                                                                bgcolor: 'grey.50',
                                                                border: '1px solid',
                                                                borderColor: 'grey.200',
                                                                minWidth: 140,
                                                            }}
                                                        >
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {balance.coin}
                                                            </Typography>
                                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                                {balance.total.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                ≈ ${balance.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Portfolio Value History Chart */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                        Portfolio Value Over Time
                    </Typography>
                    {balanceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <defs>
                                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    }}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                                    width={70}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const dayTrades = data.trades || [];

                                            // Simple tooltip for days without trades
                                            if (dayTrades.length === 0) {
                                                return (
                                                    <div style={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                        padding: '10px 14px',
                                                    }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
                                                            Portfolio: ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Full tooltip for days with trades
                                            // Sort trades by timestamp within the day
                                            const sortedDayTrades = [...dayTrades].sort((a, b) =>
                                                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                            );

                                            return (
                                                <div style={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '10px',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                    padding: '14px 18px',
                                                    minWidth: '200px',
                                                }}>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                                        {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                                                        Portfolio: ${data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            Trades Executed
                                                        </div>
                                                        {sortedDayTrades.map((trade: TradeMarker, idx: number) => (
                                                            <div key={idx} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                marginBottom: idx < dayTrades.length - 1 ? '6px' : '0',
                                                                padding: '8px 10px',
                                                                backgroundColor: trade.side === 'long' ? '#ecfdf5' : trade.side === 'short' ? '#fef2f2' : '#f9fafb',
                                                                borderRadius: '6px',
                                                            }}>
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    fontWeight: 700,
                                                                    color: trade.side === 'long' ? '#10b981' : trade.side === 'short' ? '#ef4444' : '#6b7280',
                                                                    textTransform: 'uppercase',
                                                                    padding: '2px 6px',
                                                                    backgroundColor: trade.side === 'long' ? '#d1fae5' : trade.side === 'short' ? '#fee2e2' : '#f3f4f6',
                                                                    borderRadius: '4px',
                                                                }}>
                                                                    {trade.side}
                                                                </span>
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                                                                    {trade.coin}
                                                                </span>
                                                                <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: 'auto' }}>
                                                                    {trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} @ ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    dot={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const hasTrades = payload.trades && payload.trades.length > 0;
                                        if (hasTrades) {
                                            return (
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={6}
                                                    fill={payload.trades[0].side === 'long' ? '#10b981' : '#ef4444'}
                                                    stroke="#fff"
                                                    strokeWidth={2}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            );
                                        }
                                        return <circle cx={cx} cy={cy} r={0} />;
                                    }}
                                    activeDot={(props: any) => {
                                        const { cx, cy, payload } = props;
                                        const hasTrades = payload.trades && payload.trades.length > 0;
                                        if (hasTrades) {
                                            return (
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={8}
                                                    fill={payload.trades[0].side === 'long' ? '#10b981' : '#ef4444'}
                                                    stroke="#fff"
                                                    strokeWidth={3}
                                                />
                                            );
                                        }
                                        return <circle cx={cx} cy={cy} r={0} />;
                                    }}
                                    fill="url(#portfolioGradient)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography color="text.secondary">No portfolio history yet</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Recent Trades - Show 5, expandable */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'black' }}>
                            Recent Trades
                        </Typography>
                        {trades.length > 5 && (
                            <Button
                                size="small"
                                onClick={() => setTradesExpanded(!tradesExpanded)}
                                endIcon={tradesExpanded ? <ExpandLess /> : <ExpandMore />}
                            >
                                {tradesExpanded ? 'Show Less' : `Show All (${trades.length})`}
                            </Button>
                        )}
                    </Box>
                    {trades.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Time</TableCell>
                                        <TableCell>Coin</TableCell>
                                        <TableCell>Side</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                                        <TableCell align="right">Stop Loss</TableCell>
                                        <TableCell align="right">Profit Target</TableCell>
                                        <TableCell align="right">Leverage</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(tradesExpanded ? trades : trades.slice(0, 5)).map((trade) => {
                                        const totalValue = trade.quantity * trade.price;
                                        return (
                                            <TableRow key={trade.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {new Date(trade.executed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={trade.coin} size="small" color="primary" variant="outlined" />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={trade.side.toUpperCase()}
                                                        size="small"
                                                        color={trade.side === 'long' ? 'success' : trade.side === 'short' ? 'error' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    {trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                </TableCell>
                                                <TableCell align="right">
                                                    ${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: trade.side === 'long' ? 'success.main' : trade.side === 'short' ? 'error.main' : 'text.primary' }}>
                                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {trade.stop_loss_order ? (
                                                        trade.stop_loss_order.success ? (
                                                            <span style={{ color: 'success.main' }}>
                                                                ✓ {trade.stop_loss_order.percentage ? `${(trade.stop_loss_order.percentage * 100).toFixed(1)}%` : ''}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'error.main' }}>
                                                                ✗ {trade.stop_loss_order.error || 'Failed'}
                                                            </span>
                                                        )
                                                    ) : (
                                                        trade.stop_loss_pct ? (
                                                            <span style={{ color: 'warning.main' }}>
                                                                ⚠ {`${(trade.stop_loss_pct * 100).toFixed(1)}%`}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {trade.take_profit_order ? (
                                                        trade.take_profit_order.success ? (
                                                            <span style={{ color: 'success.main' }}>
                                                                ✓ {trade.take_profit_order.percentage ? `${(trade.take_profit_order.percentage * 100).toFixed(1)}%` : ''}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'error.main' }}>
                                                                ✗ {trade.take_profit_order.error || 'Failed'}
                                                            </span>
                                                        )
                                                    ) : (
                                                        trade.take_profit_pct ? (
                                                            <span style={{ color: 'warning.main' }}>
                                                                ⚠ {`${(trade.take_profit_pct * 100).toFixed(1)}%`}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {trade.leverage ? `${trade.leverage.toFixed(1)}x` : '1.0x'}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {trade.success ? (
                                                        <CheckCircle color="success" fontSize="small" />
                                                    ) : (
                                                        <MuiTooltip title={trade.error_message || 'Trade failed'}>
                                                            <Error color="error" fontSize="small" />
                                                        </MuiTooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="text.secondary">No trades yet</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* API Call Logs - Fully Collapsible */}
            <Card sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'grey.50' },
                        }}
                        onClick={() => setApiLogsExpanded(!apiLogsExpanded)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'black' }}>
                                API Call Logs
                            </Typography>
                            {apiLogs.length > 0 && (
                                <Chip label={apiLogs.length} size="small" color="default" />
                            )}
                        </Box>
                        <IconButton size="small">
                            {apiLogsExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                    <Collapse in={apiLogsExpanded}>
                        <Box sx={{ px: 2, pb: 2 }}>
                            {apiLogs.length > 0 ? (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Time</TableCell>
                                                <TableCell>Model</TableCell>
                                                <TableCell>Decision</TableCell>
                                                <TableCell align="right">Tokens</TableCell>
                                                <TableCell align="right">Latency</TableCell>
                                                <TableCell align="center">View</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {apiLogs.map((log) => (
                                                <TableRow
                                                    key={log.id}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: 'primary.50' },
                                                    }}
                                                    onClick={() => setSelectedApiLog(log)}
                                                >
                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                        {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={log.model_name} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.decision_action && log.decision_coin ? (
                                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                                <Chip
                                                                    label={log.decision_action.toUpperCase()}
                                                                    size="small"
                                                                    color={log.decision_action === 'long' ? 'success' : log.decision_action === 'short' ? 'error' : 'default'}
                                                                />
                                                                <Typography variant="body2">{log.decision_coin}</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {log.tokens_used ? log.tokens_used.toLocaleString() : '-'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {log.latency_ms ? `${log.latency_ms}ms` : '-'}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton size="small" color="primary">
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography color="text.secondary">No API logs yet</Typography>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>

            {/* API Log Detail Dialog */}
            <Dialog
                open={!!selectedApiLog}
                onClose={() => setSelectedApiLog(null)}
                maxWidth="md"
                fullWidth
            >
                {selectedApiLog && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">API Call Details</Typography>
                                    <Chip label={selectedApiLog.model_name} size="small" color="primary" />
                                    {selectedApiLog.success ? (
                                        <Chip label="Success" size="small" color="success" />
                                    ) : (
                                        <Chip label="Failed" size="small" color="error" />
                                    )}
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(selectedApiLog.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Decision Summary */}
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Decision
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    {selectedApiLog.decision_action && (
                                        <Chip
                                            label={selectedApiLog.decision_action.toUpperCase()}
                                            color={selectedApiLog.decision_action === 'long' ? 'success' : selectedApiLog.decision_action === 'short' ? 'error' : 'default'}
                                        />
                                    )}
                                    {selectedApiLog.decision_coin && (
                                        <Typography variant="h6">{selectedApiLog.decision_coin}</Typography>
                                    )}
                                    {selectedApiLog.decision_quantity && (
                                        <Typography variant="body1">
                                            Qty: {selectedApiLog.decision_quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                        </Typography>
                                    )}
                                    {selectedApiLog.decision_uncertainty !== null && (
                                        <Typography variant="body2" color="text.secondary">
                                            Uncertainty: {(selectedApiLog.decision_uncertainty * 100).toFixed(1)}%
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tokens: {selectedApiLog.tokens_used?.toLocaleString() || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Latency: {selectedApiLog.latency_ms ? `${selectedApiLog.latency_ms}ms` : 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* User Prompt */}
                            {selectedApiLog.prompt && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        Prompt Sent to LLM
                                    </Typography>
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: '#0d1117',
                                            borderRadius: 1,
                                            maxHeight: 250,
                                            overflow: 'auto',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            color: '#8b949e',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #30363d',
                                        }}
                                    >
                                        {selectedApiLog.prompt}
                                    </Box>
                                </Box>
                            )}

                            {/* LLM Response */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    LLM Response
                                </Typography>
                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: '#1e1e1e',
                                        borderRadius: 1,
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        color: '#d4d4d4',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {selectedApiLog.response}
                                </Box>
                            </Box>

                            {/* Error Message if any */}
                            {selectedApiLog.error_message && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {selectedApiLog.error_message}
                                </Alert>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedApiLog(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default Dashboard;
