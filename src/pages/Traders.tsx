import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Dialog,
    CircularProgress,
    Alert,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    IconButton,
} from '@mui/material';
import { AddCircle, TrendingUp, Speed, Schedule, Delete, Info } from '@mui/icons-material';
import axios from 'axios';
import TraderCreator from '../components/TraderCreator';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Trader {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    balance: number;
    tickers: string;
    llm_model?: string;
    trading_frequency?: string;
    prompt?: string;
}

/**
 * Helper function to parse tickers/coins from backend format.
 */
function parseCoins(tickers?: string): string[] {
    if (!tickers) return [];
    try {
        const parsed = JSON.parse(tickers);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (e) {
        return tickers.split(',').map((t) => t.trim()).filter(Boolean);
    }
    return [tickers];
}

const Traders: React.FC = () => {
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleDialogOpen = () => setOpenDialog(true);
    const handleDialogClose = () => setOpenDialog(false);

    const handleDetailsOpen = (trader: Trader) => {
        setSelectedTrader(trader);
        setOpenDetailsDialog(true);
    };

    const handleDetailsClose = () => {
        setOpenDetailsDialog(false);
        setSelectedTrader(null);
    };

    const handleDeleteOpen = (trader: Trader) => {
        setSelectedTrader(trader);
        setOpenDeleteDialog(true);
    };

    const handleDeleteClose = () => {
        setOpenDeleteDialog(false);
        setSelectedTrader(null);
    };

    const handleActivateTrader = async (traderId: number, currentActive: boolean) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/models/${traderId}/activate`,
                { active: !currentActive },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            setTraders(response.data.models);
            setError(null);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            setError('Failed to update trader status');
        }
    };

    const handleDeleteTrader = async () => {
        if (!selectedTrader) return;

        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND_URL}/models/${selectedTrader.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            handleDeleteClose();
            fetchTraders();
            setError(null);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
                return;
            }
            setError('Failed to delete trader');
            handleDeleteClose();
        }
    };

    const fetchTraders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/models/list`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setTraders(response.data.models || []);
            if (response.status === 401) {
                logout();
                navigate('/');
                return;
            }
        } catch (err) {
            setError('Failed to fetch traders');
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    const handleCreateSuccess = () => {
        handleDialogClose();
        fetchTraders();
    };

    useEffect(() => {
        fetchTraders();
    }, [fetchTraders]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: 'black' }}>
                Trading Agents
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Dialog for Trader Creator */}
            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    },
                }}
            >
                <TraderCreator onSuccess={handleCreateSuccess} />
            </Dialog>

            {/* Dialog for Trader Details */}
            <Dialog
                open={openDetailsDialog}
                onClose={handleDetailsClose}
                maxWidth="sm"
                fullWidth
            >
                {selectedTrader && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">{selectedTrader.name}</Typography>
                                <Chip
                                    label={selectedTrader.active ? 'Active' : 'Inactive'}
                                    size="small"
                                    color={selectedTrader.active ? 'success' : 'default'}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                {selectedTrader.llm_model && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">LLM Model</Typography>
                                        <Typography variant="body1">{selectedTrader.llm_model.toUpperCase()}</Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Trading Coins</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {parseCoins(selectedTrader.tickers).map((coin, idx) => (
                                            <Chip key={idx} label={coin} size="small" color="info" />
                                        ))}
                                    </Box>
                                </Box>
                                {selectedTrader.trading_frequency && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Trading Frequency</Typography>
                                        <Typography variant="body1">
                                            {selectedTrader.trading_frequency === '1min' ? 'Every Minute' :
                                                selectedTrader.trading_frequency === '5min' ? 'Every 5 Minutes' :
                                                    selectedTrader.trading_frequency === '15min' ? 'Every 15 Minutes' :
                                                        selectedTrader.trading_frequency === '30min' ? 'Every 30 Minutes' :
                                                            selectedTrader.trading_frequency === '1hour' ? 'Every Hour' :
                                                                selectedTrader.trading_frequency === '4hour' ? 'Every 4 Hours' :
                                                                    selectedTrader.trading_frequency === '1day' ? 'Once Per Day' :
                                                                        selectedTrader.trading_frequency}
                                        </Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">Balance</Typography>
                                    <Typography variant="body1">
                                        {selectedTrader.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </Typography>
                                </Box>
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
                                {selectedTrader.prompt && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Trading Prompt</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                            {selectedTrader.prompt}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDetailsClose}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Dialog for Delete Confirmation */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteClose}
            >
                <DialogTitle>Delete Trading Agent</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{selectedTrader?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose}>Cancel</Button>
                    <Button onClick={handleDeleteTrader} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {traders.length === 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                        No trading agents yet
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: '500px' }}>
                        Create your first AI trading agent. Choose an LLM model, select coins, set trading frequency, and define the prompt that drives its trading decisions.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddCircle />}
                        onClick={handleDialogOpen}
                        size="large"
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            borderRadius: 2,
                        }}
                    >
                        Create Your First Trading Agent
                    </Button>
                </Box>
            ) : (
                <>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                            gap: 3,
                            mb: 4,
                        }}
                    >
                        {traders.map((trader) => (
                            <Card
                                key={trader.id}
                                elevation={0}
                                sx={{
                                    height: '100%',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: trader.active ? 'primary.main' : 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 2,
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                {trader.name}
                                            </Typography>
                                            {trader.llm_model && (
                                                <Chip
                                                    label={trader.llm_model.toUpperCase()}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ mb: 1, mr: 0.5 }}
                                                />
                                            )}
                                            {parseCoins(trader.tickers).map((coin, idx) => (
                                                <Chip key={idx} label={coin} size="small" color="info" sx={{ mr: 0.5, mb: 0.5 }} />
                                            ))}
                                        </Box>
                                        <Chip
                                            label={trader.active ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={trader.active ? 'success' : 'default'}
                                        />
                                    </Box>

                                    {trader.prompt && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {trader.prompt}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TrendingUp sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Balance: {trader.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                            </Typography>
                                        </Box>
                                        {trader.trading_frequency && (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Schedule sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {trader.trading_frequency === '1min' ? 'Every Minute' :
                                                        trader.trading_frequency === '5min' ? 'Every 5 Minutes' :
                                                            trader.trading_frequency === '15min' ? 'Every 15 Minutes' :
                                                                trader.trading_frequency === '30min' ? 'Every 30 Minutes' :
                                                                    trader.trading_frequency === '1hour' ? 'Every Hour' :
                                                                        trader.trading_frequency === '4hour' ? 'Every 4 Hours' :
                                                                            trader.trading_frequency === '1day' ? 'Once Per Day' :
                                                                                trader.trading_frequency}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Speed sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Created: {new Date(trader.created_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            startIcon={<Info />}
                                            onClick={() => handleDetailsOpen(trader)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            variant={trader.active ? 'outlined' : 'contained'}
                                            size="small"
                                            fullWidth
                                            onClick={() => handleActivateTrader(trader.id, trader.active)}
                                            sx={{
                                                textTransform: 'none',
                                                ...(trader.active
                                                    ? {
                                                        color: 'error.main',
                                                        borderColor: 'error.main',
                                                        '&:hover': {
                                                            borderColor: 'error.dark',
                                                            bgcolor: 'error.light',
                                                            color: 'error.dark',
                                                        },
                                                    }
                                                    : {
                                                        bgcolor: 'primary.main',
                                                        '&:hover': {
                                                            bgcolor: 'primary.dark',
                                                        },
                                                    }),
                                            }}
                                        >
                                            {trader.active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteOpen(trader)}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'error.main',
                                                '&:hover': {
                                                    bgcolor: 'error.light',
                                                },
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'left',
                            mt: 4,
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<AddCircle />}
                            onClick={handleDialogOpen}
                            size="medium"
                            sx={{
                                px: 3,
                                py: 1.5,
                                fontSize: '1rem',
                                borderWidth: 2,
                                borderRadius: 2,
                                '&:hover': {
                                    borderWidth: 2,
                                },
                            }}
                        >
                            Create New Trading Agent
                        </Button>
                    </Box>
                </>
            )}
        </Container>
    );
};

export default Traders;
