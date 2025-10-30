import React from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Define pricing tiers
const pricingTiers = [
    {
        title: 'Starter',
        price: 'Free',
        description: 'Perfect for getting started with algorithmic trading',
        features: [
            '1 trading model',
            'Basic market data access',
            'Your model is called once per day',
            'Community leaderboard access',
            'Email support',
        ],
        buttonText: 'Get Started',
        highlighted: false,
    },
    {
        title: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For serious traders and developers',
        features: [
            'Unlimited trading models',
            'Advanced market data access',
            'Real-time performance analytics',
            'Up to 1-minute model execution intervals',
            'Priority support',
        ],
        buttonText: 'Start Free Trial',
        highlighted: true,
    },
    {
        title: 'Enterprise',
        price: 'Custom',
        description: 'For organizations and teams',
        features: [
            'Everything in Pro',
            'Dedicated account manager',
            'Custom integrations',
            'Team collaboration tools',
            'Advanced security features',
            'SLA guarantees',
        ],
        buttonText: 'Contact Sales',
        highlighted: false,
    },
];

const Pricing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box id="pricing-section" sx={{ py: 10, bgcolor: 'background.paper' }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            mb: 2,
                            background: 'linear-gradient(45deg, #10b981 30%, #059669 90%)',
                            backgroundClip: 'text',
                            textFillColor: 'transparent',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Simple, Transparent Pricing
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Choose the perfect plan for your trading needs. All plans include a 3-day free trial.
                    </Typography>
                </Box>

                {/* Pricing Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(3, 1fr)',
                        },
                        gap: 4,
                        alignItems: 'stretch',
                    }}
                >
                    {pricingTiers.map((tier) => (
                        <Card
                            key={tier.title}
                            elevation={0}
                            sx={{
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: tier.highlighted ? 'primary.main' : 'divider',
                                position: 'relative',
                                overflow: 'visible',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                },
                                ...(tier.highlighted && {
                                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)',
                                }),
                            }}
                        >
                            {tier.highlighted && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -12,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        fontSize: 14,
                                        fontWeight: 600,
                                    }}
                                >
                                    Most Popular
                                </Box>
                            )}
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                    {tier.title}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontWeight: 800,
                                            display: 'inline',
                                            color: tier.highlighted ? 'primary.main' : 'text.primary',
                                        }}
                                    >
                                        {tier.price}
                                    </Typography>
                                    {tier.period && (
                                        <Typography
                                            variant="subtitle1"
                                            color="text.secondary"
                                            sx={{ display: 'inline', ml: 0.5 }}
                                        >
                                            {tier.period}
                                        </Typography>
                                    )}
                                </Box>
                                <Typography color="text.secondary" sx={{ mb: 3 }}>
                                    {tier.description}
                                </Typography>
                                <List sx={{ mb: 4 }}>
                                    {tier.features.map((feature) => (
                                        <ListItem key={feature} sx={{ px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <CheckCircle
                                                    sx={{
                                                        color: tier.highlighted
                                                            ? 'primary.main'
                                                            : 'success.main',
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={feature} />
                                        </ListItem>
                                    ))}
                                </List>
                                <Button
                                    variant={tier.highlighted ? 'contained' : 'outlined'}
                                    fullWidth
                                    size="large"
                                    onClick={() => navigate('/signup')}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1.5,
                                        fontWeight: 600,
                                        ...(tier.highlighted && {
                                            bgcolor: 'primary.main',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                        }),
                                    }}
                                >
                                    {tier.buttonText}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Container>
        </Box>
    );
};

export default Pricing;

