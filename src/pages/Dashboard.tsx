import React from 'react';
import { Box, Container, Typography, Paper, Card, CardContent } from '@mui/material';
import { TrendingUp, AccountBalance, Timeline, Assessment } from '@mui/icons-material';

// Mock data for dashboard metrics
const metrics = [
    { title: 'Total Models', value: '12', icon: <Assessment sx={{ fontSize: 40, color: 'primary.main' }} /> },
    { title: 'Active Predictions', value: '8', icon: <Timeline sx={{ fontSize: 40, color: 'primary.main' }} /> },
    { title: 'Success Rate', value: '78%', icon: <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} /> },
    { title: 'Total Value', value: '$45,678', icon: <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} /> },
];

// Mock data for recent predictions
const recentPredictions = [
    { stock: 'AAPL', prediction: 'Bullish', confidence: '85%', date: '2024-03-20' },
    { stock: 'MSFT', prediction: 'Bearish', confidence: '72%', date: '2024-03-19' },
    { stock: 'GOOGL', prediction: 'Bullish', confidence: '91%', date: '2024-03-18' },
];

const Dashboard: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Dashboard
            </Typography>

            {/* Metrics Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                {metrics.map((metric) => (
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
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {metric.value}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {/* Recent Predictions */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Recent Predictions
            </Typography>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3
            }}>
                {recentPredictions.map((prediction) => (
                    <Card key={prediction.stock} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {prediction.stock}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Prediction</Typography>
                                <Typography
                                    sx={{
                                        color: prediction.prediction === 'Bullish' ? 'success.main' : 'error.main',
                                        fontWeight: 600,
                                    }}
                                >
                                    {prediction.prediction}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Confidence</Typography>
                                <Typography sx={{ fontWeight: 600 }}>{prediction.confidence}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Date</Typography>
                                <Typography>{prediction.date}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default Dashboard; 