import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    AlertTitle,
    Button,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material';
import { EmojiEvents, TrendingUp, AccountBalance, Refresh, Person, Schedule } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Define interface for leaderboard data
interface LeaderboardEntry {
    rank: number | null;
    name: string;
    avatar: string | null;
    coins: string[];
    profit: string;
    netGain: string;
    volume: string;
    totalTrades?: number;
    active?: boolean;
    isCurrentUser?: boolean;
    balance?: number;
    start_balance?: number;
    created_at?: string;
    llm_model?: string;
    trading_frequency?: string;
    prompt?: string;
    trader_id?: number;
}

interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    currentUser: LeaderboardEntry | null;
}

/**
 * Helper function to format trading frequency
 */
function formatFrequency(freq?: string): string {
    if (!freq) return 'Not set';
    const freqMap: Record<string, string> = {
        '1min': 'Every Minute',
        '5min': 'Every 5 Minutes',
        '15min': 'Every 15 Minutes',
        '30min': 'Every 30 Minutes',
        '1hour': 'Every Hour',
        '4hour': 'Every 4 Hours',
        '1day': 'Once Per Day'
    };
    return freqMap[freq] || freq;
}

const Leaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTrader, setSelectedTrader] = useState<LeaderboardEntry | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleOpenDetails = (trader: LeaderboardEntry) => {
        setSelectedTrader(trader);
        setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedTrader(null);
    };

    const fetchLeaderboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setLeaderboardData(response.data);
            if (response.status === 401) {
                logout();
                navigate('/');
                return;
            }

        } catch (err) {
            setError('Unable to fetch leaderboard data. This could be due to a temporary service disruption or network issue.');
            console.error('Error fetching leaderboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => {
        fetchLeaderboardData();
        const interval = setInterval(fetchLeaderboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchLeaderboardData]);

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
                    sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}
                >
                    <AlertTitle>Leaderboard Data Unavailable</AlertTitle>
                    {error}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Refresh />}
                            onClick={fetchLeaderboardData}
                            sx={{ mt: 1 }}
                        >
                            Retry
                        </Button>
                    </Box>
                </Alert>
            </Container>
        );
    }

    const topPerformers = leaderboardData?.leaderboard || [];
    const currentUser = leaderboardData?.currentUser;

    // Coins display component
    const CoinsDisplay: React.FC<{ coins: string[], maxVisible?: number }> = ({ coins, maxVisible = 2 }) => {
        if (!coins || coins.length === 0) {
            return <Typography variant="body2" color="text.secondary">-</Typography>;
        }

        const visibleCoins = coins.slice(0, maxVisible);
        const hiddenCoins = coins.slice(maxVisible);

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                {visibleCoins.map((coin, idx) => (
                    <Chip key={idx} label={coin} size="small" color="info" sx={{ height: 22, fontSize: '0.75rem' }} />
                ))}
                {hiddenCoins.length > 0 && (
                    <Tooltip title={hiddenCoins.join(', ')} arrow placement="top">
                        <Chip
                            label={`+${hiddenCoins.length}`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.75rem', cursor: 'pointer' }}
                        />
                    </Tooltip>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Leaderboard
            </Typography>

            {/* Trader Details Dialog */}
            <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
                {selectedTrader && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: selectedTrader.rank && selectedTrader.rank <= 3 ? 'primary.main' : 'grey.300',
                                            color: selectedTrader.rank && selectedTrader.rank <= 3 ? 'white' : 'text.primary',
                                        }}
                                        src={selectedTrader.avatar?.startsWith('http') ? selectedTrader.avatar : undefined}
                                    >
                                        {!selectedTrader.avatar?.startsWith('http') && selectedTrader.avatar}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">{selectedTrader.name}</Typography>
                                        {selectedTrader.rank && (
                                            <Chip label={`Rank #${selectedTrader.rank}`} size="small" color="primary" />
                                        )}
                                    </Box>
                                </Box>
                                <Chip
                                    label={selectedTrader.active ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={selectedTrader.active ? 'success' : 'default'}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                                {/* Performance Stats */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary">Profit</Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: selectedTrader.profit?.startsWith('+') ? 'success.main' :
                                                    selectedTrader.profit?.startsWith('-') ? 'error.main' : 'text.primary'
                                            }}
                                        >
                                            {selectedTrader.profit}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary">Net Gain</Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: selectedTrader.netGain?.includes('+') ? 'success.main' :
                                                    selectedTrader.netGain?.includes('-') ? 'error.main' : 'text.primary'
                                            }}
                                        >
                                            {selectedTrader.netGain}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                        <Typography variant="body2" color="text.secondary">Volume</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {selectedTrader.volume}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* LLM Model */}
                                {selectedTrader.llm_model && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">LLM Model</Typography>
                                        <Typography variant="body1">{selectedTrader.llm_model.toUpperCase()}</Typography>
                                    </Box>
                                )}

                                {/* Trading Coins */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Trading Coins</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {selectedTrader.coins && selectedTrader.coins.length > 0 ? (
                                            selectedTrader.coins.map((coin, idx) => (
                                                <Chip key={idx} label={coin} size="small" color="info" />
                                            ))
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">Not specified</Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* Trading Frequency */}
                                {selectedTrader.trading_frequency && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Trading Frequency</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            <Schedule sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body1">
                                                {formatFrequency(selectedTrader.trading_frequency)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* Balance Info */}
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Current Balance</Typography>
                                        <Typography variant="body1">
                                            {selectedTrader.balance?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Starting Balance</Typography>
                                        <Typography variant="body1">
                                            {selectedTrader.start_balance?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '-'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Total Trades */}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Total Trades</Typography>
                                    <Typography variant="body1">{selectedTrader.totalTrades ?? 0}</Typography>
                                </Box>

                                {/* Created */}
                                {selectedTrader.created_at && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                                        <Typography variant="body1">
                                            {new Date(selectedTrader.created_at).toLocaleString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Trading Prompt */}
                                {selectedTrader.prompt && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Trading Prompt</Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 0.5,
                                                whiteSpace: 'pre-wrap',
                                                bgcolor: 'grey.50',
                                                p: 1.5,
                                                borderRadius: 1,
                                                maxHeight: 150,
                                                overflow: 'auto'
                                            }}
                                        >
                                            {selectedTrader.prompt}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDetails}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Top 3 Performers */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                {topPerformers.slice(0, 3).map((performer) => (
                    <Card
                        key={performer.rank}
                        elevation={0}
                        onClick={() => handleOpenDetails(performer)}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            overflow: 'visible',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                boxShadow: 3,
                                transform: 'translateY(-2px)'
                            }
                        }}
                    >
                        {performer.rank === 1 && (
                            <EmojiEvents
                                sx={{
                                    position: 'absolute',
                                    top: -20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: 40,
                                    color: '#FFD700',
                                }}
                            />
                        )}
                        <CardContent sx={{ pt: performer.rank === 1 ? 4 : 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: performer.rank === 1 ? 'primary.main' : 'grey.200',
                                        color: performer.rank === 1 ? 'white' : 'text.primary',
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                    }}
                                    src={performer.avatar?.startsWith('http') ? performer.avatar : undefined}
                                >
                                    {!performer.avatar?.startsWith('http') && performer.avatar}
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {performer.name}
                                    </Typography>
                                    <CoinsDisplay coins={performer.coins} maxVisible={3} />
                                </Box>
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUp sx={{ color: performer.netGain?.includes('+') ? 'success.main' : 'error.main', mr: 1 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Net Gain
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 600,
                                                color: performer.netGain?.includes('+') ? 'success.main' :
                                                    performer.netGain?.includes('-') ? 'error.main' : 'text.primary'
                                            }}
                                        >
                                            {performer.netGain}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Volume
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {performer.volume}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Full Leaderboard Table */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Full Rankings
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Trader</TableCell>
                            <TableCell>Coins</TableCell>
                            <TableCell align="right">Trades</TableCell>
                            <TableCell align="right">Volume</TableCell>
                            <TableCell align="right">Net Gain</TableCell>
                            <TableCell align="right">Profit %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {topPerformers.map((performer) => (
                            <TableRow
                                key={performer.rank || 'unranked'}
                                onClick={() => handleOpenDetails(performer)}
                                sx={{
                                    bgcolor: performer.isCurrentUser ? 'action.selected' : 'inherit',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <TableCell>
                                    <Chip
                                        label={`#${performer.rank || 'NA'}`}
                                        size="small"
                                        color={performer.rank && performer.rank <= 3 ? 'primary' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: performer.rank && performer.rank <= 3 ? 'primary.main' : 'grey.200',
                                                color: performer.rank && performer.rank <= 3 ? 'white' : 'text.primary',
                                                fontSize: '0.875rem',
                                                mr: 1,
                                            }}
                                            src={performer.avatar?.startsWith('http') ? performer.avatar : undefined}
                                        >
                                            {!performer.avatar?.startsWith('http') && performer.avatar}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: performer.isCurrentUser ? 600 : 400 }}>
                                                {performer.name}
                                                {performer.isCurrentUser && (
                                                    <Chip label="You" size="small" color="secondary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                                )}
                                            </Typography>
                                            {performer.active && (
                                                <Chip label="Active" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />
                                            )}
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <CoinsDisplay coins={performer.coins} maxVisible={2} />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="text.secondary">
                                        {performer.totalTrades ?? 0}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {performer.volume}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right" sx={{
                                    color: performer.netGain?.includes('+') ? 'success.main' :
                                        performer.netGain?.includes('-') ? 'error.main' : 'text.primary',
                                    fontWeight: 600
                                }}>
                                    {performer.netGain}
                                </TableCell>
                                <TableCell align="right" sx={{
                                    color: performer.profit?.startsWith('+') ? 'success.main' :
                                        performer.profit?.startsWith('-') ? 'error.main' : 'text.primary',
                                    fontWeight: 600
                                }}>
                                    {performer.profit}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Current User Row (if not in top performers) */}
                        {currentUser && !topPerformers.some(p => p.isCurrentUser) && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Divider />
                                    </TableCell>
                                </TableRow>
                                <TableRow
                                    onClick={() => handleOpenDetails(currentUser)}
                                    sx={{ bgcolor: 'action.selected', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={currentUser.rank ? `#${currentUser.rank}` : '#NA'}
                                            size="small"
                                            color="secondary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: 'secondary.main',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    mr: 1,
                                                }}
                                                src={currentUser.avatar?.startsWith('http') ? currentUser.avatar : undefined}
                                            >
                                                {!currentUser.avatar?.startsWith('http') ? <Person /> : null}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {currentUser.name}
                                                    <Chip label="You" size="small" color="secondary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                                </Typography>
                                                {currentUser.active && (
                                                    <Chip label="Active" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', mt: 0.5 }} />
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <CoinsDisplay coins={currentUser.coins} maxVisible={2} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" color="text.secondary">
                                            {currentUser.totalTrades ?? 0}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2">
                                            {currentUser.volume}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        color: currentUser.netGain?.includes('+') ? 'success.main' :
                                            currentUser.netGain?.includes('-') ? 'error.main' : 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        {currentUser.netGain}
                                    </TableCell>
                                    <TableCell align="right" sx={{
                                        color: currentUser.profit?.startsWith('+') ? 'success.main' :
                                            currentUser.profit?.startsWith('-') ? 'error.main' : 'text.primary',
                                        fontWeight: 600
                                    }}>
                                        {currentUser.profit}
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Leaderboard;
