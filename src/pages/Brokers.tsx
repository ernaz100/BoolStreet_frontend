import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    VpnKey as VpnKeyIcon,
    Visibility,
    VisibilityOff,
    CheckCircle,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface BrokerConnection {
    id: number;
    exchange: string;
    api_key?: string;
    api_secret?: string;
    main_wallet_address?: string;
    is_testnet?: boolean;
    is_connected: boolean;
    connection_status: 'connected' | 'disconnected' | 'error';
    created_at: string;
    last_verified?: string;
}

interface ExchangeConfig {
    name: string;
    displayName: string;
    supported: boolean;
    icon?: string;
}

const EXCHANGES: ExchangeConfig[] = [
    {
        name: 'hyperliquid',
        displayName: 'Hyperliquid',
        supported: true,
    },
];

const Brokers: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [connections, setConnections] = useState<BrokerConnection[]>([]);

    // Form state for adding new connection
    const [selectedExchange, setSelectedExchange] = useState<string>('hyperliquid');
    // Hyperliquid-specific fields
    const [mainWalletAddress, setMainWalletAddress] = useState('');
    const [agentWalletPrivateKey, setAgentWalletPrivateKey] = useState('');
    const [isTestnet, setIsTestnet] = useState(false);
    const [showAgentKey, setShowAgentKey] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [testing, setTesting] = useState<{ [key: number]: boolean }>({});

    // Fetch existing connections
    const fetchConnections = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/brokers/connections`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setConnections(response.data.connections);
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            } else {
                setError('Failed to load broker connections');
            }
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    // Handle adding a new broker connection
    const handleAddConnection = async () => {
        // Validate based on exchange type
        if (selectedExchange === 'hyperliquid') {
            if (!mainWalletAddress.trim() || !agentWalletPrivateKey.trim()) {
                setError('Please provide both Main Wallet Address and Agent Wallet Private Key');
                return;
            }
            // Validate wallet address format
            if (!mainWalletAddress.startsWith('0x') || mainWalletAddress.length !== 42) {
                setError('Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
                return;
            }
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const requestData: any = {
                exchange: selectedExchange,
            };

            if (selectedExchange === 'hyperliquid') {
                requestData.main_wallet_address = mainWalletAddress.trim();
                requestData.agent_wallet_private_key = agentWalletPrivateKey.trim();
                requestData.is_testnet = isTestnet;
            }

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/brokers/connections`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(response.data);
            setSuccess('Broker connection added successfully!');
            // Reset form fields
            setMainWalletAddress('');
            setAgentWalletPrivateKey('');
            setIsTestnet(false);
            await fetchConnections();
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            } else {
                setError(err.response?.data?.error || 'Failed to add broker connection');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle testing a connection
    const handleTestConnection = async (connectionId: number) => {
        setTesting({ ...testing, [connectionId]: true });
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/brokers/connections/${connectionId}/test`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.data.valid) {
                setSuccess(`Connection to ${response.data.exchange} verified successfully!`);
                await fetchConnections();
            } else {
                setError(`Connection test failed: ${response.data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to test connection');
        } finally {
            setTesting({ ...testing, [connectionId]: false });
        }
    };

    // Handle deleting a connection
    const handleDeleteConnection = async (connectionId: number) => {
        if (!window.confirm('Are you sure you want to delete this broker connection?')) {
            return;
        }

        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/brokers/connections/${connectionId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setSuccess('Broker connection deleted successfully');
            await fetchConnections();
        } catch (err: any) {
            if (err.response?.status === 401) {
                logout();
                navigate('/');
            } else {
                setError(err.response?.data?.error || 'Failed to delete connection');
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected':
                return 'success';
            case 'error':
                return 'error';
            default:
                return 'default';
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
                Broker Connections
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Connect your crypto exchange accounts to enable trading. Your API keys are encrypted and stored securely.
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

            {/* Add New Connection Form */}
            <Card sx={{ mb: 4, borderRadius: 2 }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Add New Broker Connection
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                Exchange
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {EXCHANGES.map((exchange) => (
                                    <Chip
                                        key={exchange.name}
                                        label={exchange.displayName}
                                        onClick={() => setSelectedExchange(exchange.name)}
                                        color={selectedExchange === exchange.name ? 'primary' : 'default'}
                                        variant={selectedExchange === exchange.name ? 'filled' : 'outlined'}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                        {selectedExchange === 'hyperliquid' && (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        Hyperliquid Wallet Information
                                    </Typography>
                                    <Tooltip
                                        title={
                                            <Box sx={{ p: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                                    How to get your Hyperliquid credentials:
                                                </Typography>
                                                <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: '0.875rem' }}>
                                                    <Box component="li" sx={{ mb: 0.5 }}>
                                                        Visit Hyperliquid and log in with your wallet
                                                    </Box>
                                                    <Box component="li" sx={{ mb: 0.5 }}>
                                                        Go to the API page (app.hyperliquid.xyz/API)
                                                    </Box>
                                                    <Box component="li" sx={{ mb: 0.5 }}>
                                                        Click "Generate" to create an agent wallet
                                                    </Box>
                                                    <Box component="li" sx={{ mb: 0.5 }}>
                                                        <strong>Copy the private key</strong> (64 hex characters, NOT the address!)
                                                    </Box>
                                                    <Box component="li" sx={{ mb: 0.5 }}>
                                                        Authorize the agent wallet for trading
                                                    </Box>
                                                    <Box component="li">
                                                        Use your <strong>main wallet address</strong> (the one you logged in with) below
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" sx={{ mt: 1.5, fontStyle: 'italic', color: 'warning.light' }}>
                                                    Note: The agent wallet is for trading only and cannot withdraw funds.
                                                </Typography>
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                        sx={{ maxWidth: 400 }}
                                    >
                                        <IconButton size="small" sx={{ color: 'primary.main' }}>
                                            <InfoIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <TextField
                                    label="Main Wallet Address (Your Wallet)"
                                    value={mainWalletAddress}
                                    onChange={(e) => setMainWalletAddress(e.target.value)}
                                    fullWidth
                                    placeholder="0x... (the wallet you log into Hyperliquid with)"
                                    sx={{ mb: 3 }}
                                    helperText="Your main wallet address that holds funds on Hyperliquid (NOT the API/agent wallet address)"
                                />
                                <TextField
                                    label="Agent Wallet Private Key (from API page)"
                                    type={showAgentKey ? 'text' : 'password'}
                                    value={agentWalletPrivateKey}
                                    onChange={(e) => setAgentWalletPrivateKey(e.target.value)}
                                    fullWidth
                                    placeholder="64 hex characters (e.g., a1b2c3d4...)"
                                    sx={{ mb: 2 }}
                                    helperText="The PRIVATE KEY from the API page (64 hex characters) — NOT an address! This is used for trade execution only."
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton onClick={() => setShowAgentKey(!showAgentKey)} edge="end">
                                                {showAgentKey ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        ),
                                    }}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isTestnet}
                                            onChange={(e) => setIsTestnet(e.target.checked)}
                                        />
                                    }
                                    label="Use Testnet"
                                />
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleAddConnection}
                            disabled={
                                submitting ||
                                (selectedExchange === 'hyperliquid' && (!mainWalletAddress.trim() || !agentWalletPrivateKey.trim()))
                            }
                            startIcon={<VpnKeyIcon />}
                            sx={{ alignSelf: 'flex-start', px: 4 }}
                        >
                            {submitting ? 'Connecting...' : 'Connect Broker'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Existing Connections */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Connected Brokers ({connections.length})
            </Typography>

            {connections.length === 0 ? (
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            No broker connections yet. Add one above to get started.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {connections.map((connection) => (
                        <Card key={connection.id} sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {connection.exchange.charAt(0).toUpperCase() + connection.exchange.slice(1)}
                                            </Typography>
                                            <Chip
                                                label={connection.connection_status}
                                                color={getStatusColor(connection.connection_status) as any}
                                                size="small"
                                                icon={
                                                    connection.connection_status === 'connected' ? (
                                                        <CheckCircle fontSize="small" />
                                                    ) : (
                                                        <ErrorIcon fontSize="small" />
                                                    )
                                                }
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Connected {new Date(connection.created_at).toLocaleDateString()}
                                            {connection.last_verified &&
                                                ` • Last verified ${new Date(connection.last_verified).toLocaleDateString()}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleTestConnection(connection.id)}
                                            disabled={testing[connection.id]}
                                        >
                                            {testing[connection.id] ? 'Testing...' : 'Test Connection'}
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteConnection(connection.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                                {connection.exchange === 'hyperliquid' && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                        <TextField
                                            label="Main Wallet Address"
                                            value={connection.main_wallet_address || ''}
                                            InputProps={{ readOnly: true }}
                                            size="small"
                                            fullWidth
                                        />
                                        {connection.is_testnet && (
                                            <Chip label="Testnet" color="info" size="small" sx={{ alignSelf: 'flex-start' }} />
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Container>
    );
};

export default Brokers;

