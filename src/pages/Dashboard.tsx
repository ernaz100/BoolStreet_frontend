import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, Typography, Paper, Card, CardContent, CircularProgress, Alert, Button, Dialog } from '@mui/material';
import { TrendingUp, AccountBalance, Timeline, Assessment, AddCircle } from '@mui/icons-material';
import ModelUploader from '../components/ModelUploader';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Utility function to get JWT token from localStorage (adjust if you use a different auth flow)
const getToken = () => localStorage.getItem('token');

const Dashboard: React.FC = () => {
    // State for metrics and predictions
    const [metrics, setMetrics] = useState<any>(null);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmpty, setIsEmpty] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    // Auth and navigation hooks for handling unauthorized
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Function to handle dialog open/close
    const handleDialogOpen = () => setOpenDialog(true);
    const handleDialogClose = () => setOpenDialog(false);

    // Function to handle successful model upload
    const handleUploadSuccess = () => {
        handleDialogClose();
        // Refresh dashboard data
        fetchData();
    };

    // Function to fetch dashboard data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            // Fetch stats
            const statsRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/dashboard/stats`, { headers });
            if (statsRes.status === 401) {
                logout();
                navigate('/');
                return;
            }
            if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats');
            const stats = await statsRes.json();

            // Fetch predictions
            const predRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/dashboard/predictions`, { headers });
            if (predRes.status === 401) {
                logout();
                navigate('/');
                return;
            }
            if (!predRes.ok) throw new Error('Failed to fetch predictions');
            const predData = await predRes.json();

            // Check if user has any data
            const hasData = stats.total_scripts > 0;
            setIsEmpty(!hasData);

            // Set state
            setMetrics({
                totalModels: stats.total_scripts || 0,
                activeModels: stats.active_scripts || 0,
                netProfit: stats.net_profit || 0,
                totalValue: stats.total_balance || 0
            });
            setPredictions(predData.predictions || []);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    // Fetch dashboard stats and predictions on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Metric cards config
    const metricCards = metrics ? [
        {
            title: 'Total Models',
            value: metrics.totalModels,
            icon: <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
        },
        {
            title: 'Active Models',
            value: metrics.activeModels,
            icon: <Timeline sx={{ fontSize: 40, color: 'primary.main' }} />
        },
        {
            title: 'Net Profit',
            value: metrics.netProfit ? `$${metrics.netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0.00',
            icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />,
            valueColor: metrics.netProfit < 0 ? 'error.main' : 'text.primary'
        },
        {
            title: 'Total Value',
            value: metrics.totalValue ? `$${metrics.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0.00',
            icon: <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
        },
    ] : [];

    // Empty state component
    const EmptyState = () => (
        <Box sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
        }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
                You either haven't uploaded any trading models yet or your models have not been trading yet. <br />
                Upload your first model to start making predictions and tracking your performance.
            </Typography>
            <Button
                variant="contained"
                size="large"
                startIcon={<AddCircle />}
                onClick={handleDialogOpen}
                sx={{
                    borderRadius: 2,
                    px: 4,
                    py: 1.5
                }}
            >
                Upload Your First Model
            </Button>
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Dialog for Model Uploader */}
            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '60vh',
                        maxHeight: '80vh'
                    }
                }}
            >
                <ModelUploader onSuccess={handleUploadSuccess} />
            </Dialog>

            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Dashboard
            </Typography>

            {/* Loading and error states */}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}><CircularProgress /></Box>}
            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            {/* Empty state */}
            {!loading && !error && isEmpty && <EmptyState />}

            {/* Metrics Grid */}
            {!loading && !error && !isEmpty && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 3,
                    mb: 4
                }}>
                    {metricCards.map((metric) => (
                        <Paper
                            key={metric.title}
                            elevation={0}
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: 140,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {metric.icon}
                                <Typography variant="h6" sx={{ ml: 2, color: 'text.secondary' }}>
                                    {metric.title}
                                </Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: metric.valueColor }}>
                                {metric.value}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            )}

            {/* Recent Predictions */}
            {!loading && !error && !isEmpty && (
                <>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        Recent Predictions
                    </Typography>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 3
                    }}>
                        {predictions.length === 0 && (
                            <Typography color="text.secondary">No recent predictions found.</Typography>
                        )}
                        {predictions.map((prediction, idx) => (
                            <Card key={idx} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        {prediction.script_name || 'Model'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography color="text.secondary">Prediction</Typography>
                                        <Typography
                                            sx={{
                                                color: prediction.prediction === 'buy' ? 'success.main' : prediction.prediction === 'sell' ? 'error.main' : 'text.primary',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {prediction.prediction}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography color="text.secondary">Confidence</Typography>
                                        <Typography sx={{ fontWeight: 600 }}>{prediction.confidence ? `${(prediction.confidence * 100).toFixed(0)}%` : 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Date</Typography>
                                        <Typography>{prediction.timestamp ? new Date(prediction.timestamp).toLocaleDateString() : ''}</Typography>
                                    </Box>
                                    {typeof prediction.profit_loss === 'number' && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography color="text.secondary">Profit/Loss</Typography>
                                            <Typography sx={{ fontWeight: 600 }} color={prediction.profit_loss >= 0 ? 'success.main' : 'error.main'}>
                                                {prediction.profit_loss >= 0 ? '+' : ''}${prediction.profit_loss.toFixed(2)}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </>
            )}
        </Container>
    );
};

export default Dashboard; 