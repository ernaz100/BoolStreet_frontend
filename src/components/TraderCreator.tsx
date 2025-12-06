import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Chip,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Paper,
    IconButton,
    Skeleton,
} from '@mui/material';
import { AutoGraph, CheckCircle, Info, ExpandMore, Code, Refresh, Shield } from '@mui/icons-material';
import Slider from '@mui/material/Slider';
import axios from 'axios';

interface TraderCreatorProps {
    onSuccess?: () => void;
}

interface ModelOption {
    id: string;
    name: string;
    provider: string;
    description: string;
    cost_tier: string;
}

interface CoinOption {
    id: string;
    name: string;
    symbol: string;
    min_size: number;
}

interface FrequencyOption {
    id: string;
    name: string;
    description: string;
    interval_minutes: number;
}

interface UncertaintyPreset {
    id: string;
    value: number;
    name: string;
    description: string;
}

interface TradingConfig {
    models: ModelOption[];
    coins: CoinOption[];
    frequencies: FrequencyOption[];
    uncertainty_presets: UncertaintyPreset[];
    defaults: {
        model: string;
        frequency: string;
        uncertainty_threshold: number;
        max_position_size_pct: number;
        leverage: number;
        stop_loss_pct: number | null;
        take_profit_pct: number | null;
    };
}

const DEFAULT_PROMPT = `It has been {minutes_since_start} minutes since you started trading. The current time is {current_time} and you've been invoked {invocation_count} times. Below, we are providing you with a variety of state data, price data, and predictive signals so you can discover alpha. Below that is your current account information, value, performance, positions, etc.

ALL OF THE PRICE OR SIGNAL DATA BELOW IS ORDERED: OLDEST → NEWEST

Timeframes note: Unless stated otherwise in a section title, intraday series are provided at 3‑minute intervals. If a coin uses a different interval, it is explicitly stated in that coin's section.

CURRENT MARKET STATE FOR ALL COINS

{market_data}

HERE IS YOUR ACCOUNT INFORMATION & PERFORMANCE

{account_data}`;

// Extract all placeholders from the default prompt
const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{[^}]+\}/g);
    return matches ? Array.from(new Set(matches)) : [];
};

const REQUIRED_PLACEHOLDERS = extractPlaceholders(DEFAULT_PROMPT);

// Placeholder documentation (descriptions only - examples are fetched live)
const PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
    '{minutes_since_start}': 'Minutes elapsed since the trader was created/started',
    '{current_time}': 'Current ISO timestamp when the trader is invoked',
    '{invocation_count}': 'Number of times this trader has been executed',
    '{market_data}': 'Real-time market data for all selected coins including price, indicators, and trends',
    '{account_data}': 'Your current account balance, positions, and performance metrics',
};

interface LivePreviewData {
    minutes_since_start: string;
    current_time: string;
    invocation_count: string;
    market_data: string;
    account_data: string;
}

interface BrokerBalance {
    total_value: number;
    available_balance: number;
    perp_positions: Array<{
        coin: string;
        size: number;
        side: string;
        entry_price: number;
        current_price: number;
        unrealized_pnl: number;
    }>;
}

const getCostColor = (costTier: string) => {
    switch (costTier) {
        case 'lowest': return 'success';
        case 'low': return 'success';
        case 'medium': return 'warning';
        case 'high': return 'error';
        default: return 'default';
    }
};

const TraderCreator: React.FC<TraderCreatorProps> = ({ onSuccess }) => {
    // Config state
    const [config, setConfig] = useState<TradingConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const [configError, setConfigError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [llmModel, setLlmModel] = useState('');
    const [coins, setCoins] = useState<string[]>([]);
    const [tradingFrequency, setTradingFrequency] = useState('');
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Risk management state
    const [uncertaintyThreshold, setUncertaintyThreshold] = useState(0.7);
    const [defaultLeverage, setDefaultLeverage] = useState(1.0);
    const [stopLossPct, setStopLossPct] = useState<number | null>(null);
    const [takeProfitPct, setTakeProfitPct] = useState<number | null>(null);
    const [riskSettingsExpanded, setRiskSettingsExpanded] = useState(false);

    // Live preview state
    const [livePreview, setLivePreview] = useState<LivePreviewData | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewExpanded, setPreviewExpanded] = useState(false);

    // Fetch live preview data
    const fetchLivePreview = useCallback(async (selectedCoins: string[]) => {
        if (selectedCoins.length === 0) {
            setLivePreview(null);
            return;
        }

        setPreviewLoading(true);
        const token = localStorage.getItem('token');

        try {
            // Fetch live market data with indicators for all selected coins
            let marketData = '';
            try {
                const coinsParam = selectedCoins.join(',');
                const marketResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/api/market/coins/live?coins=${coinsParam}`
                );
                // Use the pre-formatted prompt from the backend
                marketData = marketResponse.data.formatted_prompt || 'Failed to fetch market data';
            } catch (e: any) {
                console.log('Could not fetch live market data:', e.message);
                marketData = `Error fetching market data: ${e.message}\n\n(Data will be fetched at runtime)`;
            }

            // Fetch account data
            let accountData = 'No broker connected - connect a broker to see account data';
            try {
                const balanceResponse = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/brokers/balances`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const brokers = balanceResponse.data.brokers || [];
                if (brokers.length > 0) {
                    const broker = brokers[0] as BrokerBalance;
                    const positions = broker.perp_positions || [];
                    const positionsStr = positions.length > 0
                        ? JSON.stringify(positions, null, 2)
                        : 'No positions';

                    accountData = `Current Total Return (percent): 0.00%
Available Cash: ${broker.available_balance?.toFixed(2) || '0.00'}
Current Account Value: ${broker.total_value?.toFixed(2) || '0.00'}
Current live positions & performance: ${positionsStr}
Sharpe Ratio: 0.0`;
                }
            } catch (e) {
                // Account data fetch failed, use default message
            }

            setLivePreview({
                minutes_since_start: '0',
                current_time: new Date().toISOString(),
                invocation_count: '0',
                market_data: marketData,
                account_data: accountData,
            });
        } catch (err) {
            console.error('Failed to fetch live preview:', err);
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    // Fetch config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND_URL}/models/config`
                );
                setConfig(response.data);
                // Set defaults
                setLlmModel(response.data.defaults.model);
                setTradingFrequency(response.data.defaults.frequency);
                // Default to first coin
                if (response.data.coins.length > 0) {
                    setCoins([response.data.coins[0].id]);
                }
                // Set risk management defaults
                if (response.data.defaults.uncertainty_threshold !== undefined) {
                    setUncertaintyThreshold(response.data.defaults.uncertainty_threshold);
                }
                if (response.data.defaults.leverage !== undefined) {
                    setDefaultLeverage(response.data.defaults.leverage);
                }
            } catch (err: any) {
                setConfigError('Failed to load trading configuration');
                console.error('Config fetch error:', err);
            } finally {
                setConfigLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Fetch preview when accordion is expanded or coins change
    useEffect(() => {
        if (previewExpanded && coins.length > 0) {
            fetchLivePreview(coins);
        }
    }, [previewExpanded, coins, fetchLivePreview]);

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

        if (coins.length === 0) {
            setError('Please select at least one coin');
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
                    // Risk management settings
                    uncertainty_threshold: uncertaintyThreshold,
                    default_leverage: defaultLeverage,
                    stop_loss_pct: stopLossPct,
                    take_profit_pct: takeProfitPct,
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

    if (configLoading) {
        return (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (configError || !config) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{configError || 'Failed to load configuration'}</Alert>
            </Box>
        );
    }

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
                            {config.models.map((model) => (
                                <MenuItem key={model.id} value={model.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <span>{model.name}</span>
                                        <Chip
                                            label={model.cost_tier}
                                            size="small"
                                            color={getCostColor(model.cost_tier) as any}
                                            sx={{ ml: 'auto', textTransform: 'capitalize' }}
                                        />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {llmModel && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: -2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Info fontSize="small" />
                            {config.models.find(m => m.id === llmModel)?.description}
                        </Typography>
                    )}

                    {/* Coins */}
                    <FormControl fullWidth required>
                        <InputLabel>Coins to Trade</InputLabel>
                        <Select
                            multiple
                            value={coins}
                            label="Coins to Trade"
                            onChange={(e) => {
                                const value = e.target.value;
                                setCoins(typeof value === 'string' ? value.split(',') : value);
                            }}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const coin = config.coins.find(c => c.id === value);
                                        return (
                                            <Chip
                                                key={value}
                                                label={coin ? `${coin.id} (${coin.name})` : value}
                                                size="small"
                                            />
                                        );
                                    })}
                                </Box>
                            )}
                        >
                            {config.coins.map((coin) => (
                                <MenuItem key={coin.id} value={coin.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <Typography fontWeight={600}>{coin.id}</Typography>
                                        <Typography color="text.secondary">{coin.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                            Min: {coin.min_size}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: -2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Select the coins your agent will analyze and trade (Hyperliquid perpetuals)
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                                if (coins.length === config.coins.length) {
                                    // Deselect all
                                    setCoins([]);
                                } else {
                                    // Select all
                                    setCoins(config.coins.map(c => c.id));
                                }
                            }}
                            sx={{ ml: 'auto', textTransform: 'none', minWidth: 'auto' }}
                        >
                            {coins.length === config.coins.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </Box>

                    {/* Trading Frequency */}
                    <FormControl fullWidth required>
                        <InputLabel>Trading Frequency</InputLabel>
                        <Select
                            value={tradingFrequency}
                            label="Trading Frequency"
                            onChange={(e) => setTradingFrequency(e.target.value)}
                        >
                            {config.frequencies.map((freq) => (
                                <MenuItem key={freq.id} value={freq.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <span>{freq.name}</span>
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                            {freq.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: -2 }}>
                        How often your agent will analyze the market and make trading decisions
                    </Typography>

                    {/* Risk Management Settings */}
                    <Accordion
                        expanded={riskSettingsExpanded}
                        onChange={(_, expanded) => setRiskSettingsExpanded(expanded)}
                        sx={{
                            boxShadow: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            '&:before': { display: 'none' },
                            bgcolor: riskSettingsExpanded ? 'grey.50' : 'transparent'
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Shield fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight={500}>
                                    Risk Management Settings
                                </Typography>
                                <Chip
                                    label={`Permitted Uncertainty: ${(uncertaintyThreshold * 100).toFixed(0)}%`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ ml: 2 }}
                                />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 2 }}>
                                {/* Uncertainty Threshold */}
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Uncertainty Threshold
                                        </Typography>
                                        <Tooltip title="If the LLM's uncertainty exceeds this threshold, the trade will be skipped. Lower values = more conservative (fewer trades).">
                                            <Info fontSize="small" color="action" />
                                        </Tooltip>
                                    </Box>
                                    <Slider
                                        value={uncertaintyThreshold}
                                        onChange={(_, value) => setUncertaintyThreshold(value as number)}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                                        marks={[
                                            { value: 0.3, label: '30%' },
                                            { value: 0.5, label: '50%' },
                                            { value: 0.7, label: '70%' },
                                            { value: 1.0, label: '100%' },
                                        ]}
                                        sx={{ mx: 1 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {uncertaintyThreshold <= 0.3 && "Very conservative: Only executes trades when LLM is highly confident"}
                                        {uncertaintyThreshold > 0.3 && uncertaintyThreshold <= 0.5 && "Moderate: Executes trades when LLM is reasonably confident"}
                                        {uncertaintyThreshold > 0.5 && uncertaintyThreshold <= 0.7 && "Balanced: Skips only very uncertain trades (recommended)"}
                                        {uncertaintyThreshold > 0.7 && uncertaintyThreshold < 1.0 && "Aggressive: Executes most trades, skips only extremely uncertain ones"}
                                        {uncertaintyThreshold >= 1.0 && "Execute all: No trades will be skipped due to uncertainty"}
                                    </Typography>
                                </Box>

                                {/* Leverage */}
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Default Leverage
                                        </Typography>
                                        <Tooltip title="Leverage multiplier for trades (1x = no leverage). Higher leverage = higher risk">
                                            <Info fontSize="small" color="action" />
                                        </Tooltip>
                                        <Chip
                                            label={`${defaultLeverage}x`}
                                            size="small"
                                            color={defaultLeverage > 5 ? 'error' : defaultLeverage > 2 ? 'warning' : 'success'}
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                    <Slider
                                        value={defaultLeverage}
                                        onChange={(_, value) => setDefaultLeverage(value as number)}
                                        min={1}
                                        max={20}
                                        step={1}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}x`}
                                        marks={[
                                            { value: 1, label: '1x' },
                                            { value: 5, label: '5x' },
                                            { value: 10, label: '10x' },
                                            { value: 20, label: '20x' },
                                        ]}
                                        sx={{ mx: 1 }}
                                    />
                                    {defaultLeverage > 5 && (
                                        <Alert severity="warning" sx={{ mt: 1 }}>
                                            High leverage ({defaultLeverage}x) significantly increases both potential gains and losses
                                        </Alert>
                                    )}
                                </Box>

                                {/* Optional Stop Loss / Take Profit */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <TextField
                                        label="Stop Loss %"
                                        type="number"
                                        value={stopLossPct !== null ? (stopLossPct * 100).toFixed(1) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setStopLossPct(val ? parseFloat(val) / 100 : null);
                                        }}
                                        placeholder="e.g., 5"
                                        helperText="Auto close if loss exceeds % (optional)"
                                        size="small"
                                        sx={{ minWidth: 180 }}
                                        InputProps={{
                                            endAdornment: <Typography variant="caption">%</Typography>
                                        }}
                                    />
                                    <TextField
                                        label="Take Profit %"
                                        type="number"
                                        value={takeProfitPct !== null ? (takeProfitPct * 100).toFixed(1) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTakeProfitPct(val ? parseFloat(val) / 100 : null);
                                        }}
                                        placeholder="e.g., 10"
                                        helperText="Auto close if profit reaches % (optional)"
                                        size="small"
                                        sx={{ minWidth: 180 }}
                                        InputProps={{
                                            endAdornment: <Typography variant="caption">%</Typography>
                                        }}
                                    />
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Prompt */}
                    <TextField
                        label="Trading Prompt"
                        value={prompt}
                        inputRef={promptTextareaRef}
                        onKeyDown={(e) => {
                            const input = promptTextareaRef.current;
                            if (!input) return;
                            const selectionStart = input.selectionStart || 0;
                            const selectionEnd = input.selectionEnd || 0;

                            // Check if backspace or delete is being pressed
                            if (e.key === 'Backspace' || e.key === 'Delete') {
                                // Check if cursor is inside or about to delete a placeholder
                                for (const placeholder of REQUIRED_PLACEHOLDERS) {
                                    const placeholderIndex = prompt.indexOf(placeholder);
                                    if (placeholderIndex !== -1) {
                                        const placeholderEnd = placeholderIndex + placeholder.length;
                                        // If selection overlaps with placeholder, prevent deletion
                                        if (
                                            (selectionStart >= placeholderIndex && selectionStart < placeholderEnd) ||
                                            (selectionEnd > placeholderIndex && selectionEnd <= placeholderEnd) ||
                                            (selectionStart <= placeholderIndex && selectionEnd >= placeholderEnd)
                                        ) {
                                            e.preventDefault();
                                            return;
                                        }
                                        // If about to delete immediately before or after placeholder
                                        if (
                                            (e.key === 'Backspace' && selectionStart === placeholderEnd && selectionEnd === placeholderEnd) ||
                                            (e.key === 'Delete' && selectionStart === placeholderIndex && selectionEnd === placeholderIndex)
                                        ) {
                                            e.preventDefault();
                                            return;
                                        }
                                    }
                                }
                            }
                        }}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            // Check if any required placeholders are being removed
                            const currentPlaceholders = extractPlaceholders(newValue);
                            const missingPlaceholders = REQUIRED_PLACEHOLDERS.filter(
                                placeholder => !currentPlaceholders.includes(placeholder)
                            );

                            if (missingPlaceholders.length > 0) {
                                // Don't allow the change if placeholders are being removed
                                // Revert the change
                                const textarea = promptTextareaRef.current;
                                if (textarea) {
                                    const cursorPos = textarea.selectionStart || 0;
                                    textarea.value = prompt;
                                    // Restore cursor position
                                    setTimeout(() => {
                                        textarea.setSelectionRange(cursorPos, cursorPos);
                                    }, 0);
                                }
                                return;
                            }

                            setPrompt(newValue);
                        }}
                        onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const input = promptTextareaRef.current;
                            if (!input) return;
                            const selectionStart = input.selectionStart || 0;
                            const selectionEnd = input.selectionEnd || 0;

                            // Insert pasted text
                            const newValue =
                                prompt.substring(0, selectionStart) +
                                pastedText +
                                prompt.substring(selectionEnd);

                            // Check if placeholders are still present
                            const currentPlaceholders = extractPlaceholders(newValue);
                            const missingPlaceholders = REQUIRED_PLACEHOLDERS.filter(
                                placeholder => !currentPlaceholders.includes(placeholder)
                            );

                            if (missingPlaceholders.length === 0) {
                                setPrompt(newValue);
                                // Set cursor position after pasted text
                                setTimeout(() => {
                                    input.setSelectionRange(
                                        selectionStart + pastedText.length,
                                        selectionStart + pastedText.length
                                    );
                                }, 0);
                            }
                        }}
                        fullWidth
                        required
                        multiline
                        rows={12}
                        placeholder={DEFAULT_PROMPT}
                        helperText="This prompt defines your agent's trading strategy. The placeholders will be replaced with actual data at runtime and cannot be removed."
                        sx={{
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                            }
                        }}
                    />

                    {/* Placeholder Reference - Live Data */}
                    <Accordion
                        expanded={previewExpanded}
                        onChange={(_, expanded) => setPreviewExpanded(expanded)}
                        sx={{ mt: -1, boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}
                    >
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Code fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight={500}>
                                    Live Data Preview — Click to see actual data your LLM will receive
                                </Typography>
                                {previewLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                <Tooltip title="Refresh live data">
                                    <IconButton
                                        size="small"
                                        onClick={() => fetchLivePreview(coins)}
                                        disabled={previewLoading || coins.length === 0}
                                    >
                                        <Refresh fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {Object.entries(PLACEHOLDER_DESCRIPTIONS).map(([placeholder, description]) => {
                                    const key = placeholder.replace(/[{}]/g, '') as keyof LivePreviewData;
                                    const value = livePreview?.[key];

                                    return (
                                        <Paper
                                            key={placeholder}
                                            variant="outlined"
                                            sx={{ p: 2, bgcolor: 'grey.50' }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Chip
                                                    label={placeholder}
                                                    size="small"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        fontWeight: 600,
                                                        bgcolor: 'primary.main',
                                                        color: 'white',
                                                    }}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    {description}
                                                </Typography>
                                                {placeholder === '{market_data}' && (
                                                    <Chip
                                                        label={`${coins.length} coin${coins.length !== 1 ? 's' : ''} selected`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ ml: 'auto' }}
                                                    />
                                                )}
                                            </Box>
                                            {previewLoading ? (
                                                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                                            ) : (
                                                <Typography
                                                    variant="caption"
                                                    component="pre"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        bgcolor: 'grey.900',
                                                        color: 'grey.100',
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        overflow: 'auto',
                                                        maxHeight: 250,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        m: 0,
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {value || (coins.length === 0 ? 'Select coins to see preview' : 'Loading...')}
                                                </Typography>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

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
                        disabled={uploading || !name.trim() || !prompt.trim() || coins.length === 0}
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
