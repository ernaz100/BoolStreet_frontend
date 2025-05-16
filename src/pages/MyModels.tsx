import React from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { Add as AddIcon, TrendingUp, Speed, Psychology } from '@mui/icons-material';

// Mock data for AI models
const models = [
    {
        id: 1,
        name: 'LSTM Price Predictor',
        description: 'Long-term price prediction model using LSTM neural networks',
        accuracy: '82%',
        lastUpdated: '2024-03-20',
        status: 'Active',
        type: 'Price Prediction',
    },
    {
        id: 2,
        name: 'Sentiment Analyzer',
        description: 'News and social media sentiment analysis for market trends',
        accuracy: '75%',
        lastUpdated: '2024-03-19',
        status: 'Active',
        type: 'Sentiment Analysis',
    },
    {
        id: 3,
        name: 'Technical Indicators',
        description: 'Combined technical indicators for short-term trading',
        accuracy: '68%',
        lastUpdated: '2024-03-18',
        status: 'Inactive',
        type: 'Technical Analysis',
    },
];

const MyModels: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    My Models
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                    }}
                >
                    Create New Model
                </Button>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3
            }}>
                {models.map((model) => (
                    <Card
                        key={model.id}
                        elevation={0}
                        sx={{
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {model.name}
                                </Typography>
                                <Chip
                                    label={model.status}
                                    size="small"
                                    color={model.status === 'Active' ? 'success' : 'default'}
                                />
                            </Box>

                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {model.description}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Psychology sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Type: {model.type}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Accuracy: {model.accuracy}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Speed sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Last Updated: {model.lastUpdated}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    sx={{ textTransform: 'none' }}
                                >
                                    View Details
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    fullWidth
                                    sx={{ textTransform: 'none' }}
                                >
                                    Run Model
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default MyModels; 