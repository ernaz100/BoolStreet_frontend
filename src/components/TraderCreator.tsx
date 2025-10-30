import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { AutoGraph, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

interface TraderCreatorProps {
    onSuccess?: () => void;
}

const LLM_MODELS = [
    { value: 'gpt-5-mini', label: 'GPT 5 Mini' },
];

const COINS = [
    { value: 'DOGE', label: 'DOGE' },
];

const TRADING_FREQUENCIES = [
    { value: '1min', label: 'Every Minute' },
    { value: '5min', label: 'Every 5 Minutes' },
    { value: '15min', label: 'Every 15 Minutes' },
    { value: '30min', label: 'Every 30 Minutes' },
    { value: '1hour', label: 'Every Hour' },
    { value: '4hour', label: 'Every 4 Hours' },
    { value: '1day', label: 'Once Per Day' },
];

const TraderCreator: React.FC<TraderCreatorProps> = ({ onSuccess }) => {
    const [name, setName] = useState('');
    const [llmModel, setLlmModel] = useState('gpt-5-mini');
    const [coins, setCoins] = useState<string[]>(['DOGE']);
    const [tradingFrequency, setTradingFrequency] = useState('1hour');
    const [prompt, setPrompt] = useState('');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Please enter a name for your trader');
            return;
        }

        if (!prompt.trim()) {
            setError('Please enter a prompt for your trader');
            return;
        }

        setUploading(true);
        setError(null);
        setStatus('Creating trader...');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/models/create`,
                {
                    name: name.trim(),
                    llm_model: llmModel,
                    coins: coins,
                    trading_frequency: tradingFrequency,
                    prompt: prompt.trim(),
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(response.data);
            setStatus('Trader created successfully!');

            // Wait a moment to show success message
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess();
                }
            }, 1500);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to create trader';
            setError(errorMessage);
            setStatus(null);
            setUploading(false);
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <AutoGraph sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'black' }}>
                    Create New Trading Agent
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Name */}
                    <TextField
                        label="Trader Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g., Crypto Trader #1"
                        helperText="Give your trading agent a descriptive name"
                    />

                    {/* LLM Model */}
                    <FormControl fullWidth required>
                        <InputLabel>LLM Model</InputLabel>
                        <Select
                            value={llmModel}
                            label="LLM Model"
                            onChange={(e) => setLlmModel(e.target.value)}
                        >
                            {LLM_MODELS.map((model) => (
                                <MenuItem key={model.value} value={model.value}>
                                    {model.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Coins */}
                    <FormControl fullWidth required>
                        <InputLabel>Coins</InputLabel>
                        <Select
                            multiple
                            value={coins}
                            label="Coins"
                            onChange={(e) => {
                                const value = e.target.value;
                                setCoins(typeof value === 'string' ? value.split(',') : value);
                            }}
                            renderValue={(selected) => selected.join(', ')}
                        >
                            {COINS.map((coin) => (
                                <MenuItem key={coin.value} value={coin.value}>
                                    {coin.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: -2 }}>
                        Currently only DOGE is supported. More coins coming soon!
                    </Typography>

                    {/* Trading Frequency */}
                    <FormControl fullWidth required>
                        <InputLabel>Trading Frequency</InputLabel>
                        <Select
                            value={tradingFrequency}
                            label="Trading Frequency"
                            onChange={(e) => setTradingFrequency(e.target.value)}
                        >
                            {TRADING_FREQUENCIES.map((freq) => (
                                <MenuItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: -2 }}>
                        How often your agent will analyze the market and make trading decisions
                    </Typography>

                    {/* Prompt */}
                    <TextField
                        label="Trading Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        fullWidth
                        required
                        multiline
                        rows={6}
                        placeholder="Enter the prompt that will guide your agent's trading decisions. For example: 'You are a conservative crypto trader. Analyze market trends and make trades based on technical indicators. Prioritize risk management.'"
                        helperText="This prompt defines your agent's trading strategy and decision-making approach"
                    />

                    {/* Status and Error Messages */}
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    {status && !error && (
                        <Alert
                            severity="success"
                            icon={<CheckCircle />}
                        >
                            {status}
                        </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={uploading || !name.trim() || !prompt.trim()}
                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <AutoGraph />}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            fontSize: '1.1rem',
                            borderRadius: 2,
                        }}
                    >
                        {uploading ? 'Creating...' : 'Create Trading Agent'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default TraderCreator;

