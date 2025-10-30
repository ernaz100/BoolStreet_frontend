import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SubscriptionTier {
    title: string;
    price: string | 'Free';
    period?: string;
    description: string;
    features: string[];
    highlighted: boolean;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
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
        highlighted: false,
    },
];

const ManageAccount: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentTier, setCurrentTier] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    // Fetch current subscription
    const fetchSubscription = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: Replace with actual API call
            // const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/account/subscription`, {
            //     headers: {
            //         Authorization: `Bearer ${localStorage.getItem('token')}`,
            //     },
            // });
            // setCurrentTier(response.data.tier);

            // Mock data for now
            setCurrentTier('Starter');
            setLoading(false);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            } else {
                setError('Failed to load subscription information');
            }
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const handleUpgradeTier = async (tierTitle: string) => {
        if (tierTitle === currentTier) {
            setError('You are already on this plan');
            return;
        }

        setUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            // TODO: Replace with actual API call
            // await axios.post(
            //     `${process.env.REACT_APP_BACKEND_URL}/account/subscription`,
            //     { tier: tierTitle.toLowerCase() },
            //     {
            //         headers: {
            //             Authorization: `Bearer ${localStorage.getItem('token')}`,
            //         },
            //     }
            // );

            // Mock: Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setCurrentTier(tierTitle);
            setSuccess(`Successfully ${tierTitle === 'Free' ? 'downgraded to' : 'upgraded to'} ${tierTitle} plan`);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            } else {
                setError(err.response?.data?.error || 'Failed to update subscription');
            }
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'black' }}>
                Manage Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your subscription plan and account settings.
            </Typography>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Subscription Plans */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                Available Plans
            </Typography>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(3, 1fr)',
                    },
                    gap: 4,
                    mb: 4,
                }}
            >
                {SUBSCRIPTION_TIERS.map((tier) => (
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
                            ...(currentTier === tier.title && {
                                borderColor: 'primary.main',
                                borderWidth: 2,
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
                                    <ListItem key={feature} sx={{ px: 0, py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <CheckCircle
                                                sx={{
                                                    color: tier.highlighted
                                                        ? 'primary.main'
                                                        : 'success.main',
                                                    fontSize: 20,
                                                }}
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature}
                                            primaryTypographyProps={{
                                                sx: { fontSize: '0.9rem' },
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            <Button
                                variant={tier.highlighted && currentTier !== tier.title ? 'contained' : 'outlined'}
                                fullWidth
                                size="large"
                                onClick={() => handleUpgradeTier(tier.title)}
                                disabled={updating || currentTier === tier.title}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    fontWeight: 600,
                                    ...(tier.highlighted && currentTier !== tier.title && {
                                        bgcolor: 'primary.main',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                    }),
                                    ...(currentTier === tier.title && {
                                        borderColor: 'primary.main',
                                        color: 'primary.main',
                                    }),
                                }}
                            >
                                {currentTier === tier.title
                                    ? 'Current Plan'
                                    : updating
                                        ? 'Updating...'
                                        : tier.title === 'Enterprise'
                                            ? 'Contact Sales'
                                            : tier.price === 'Free'
                                                ? 'Downgrade to Free'
                                                : `Upgrade to ${tier.title}`}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default ManageAccount;

