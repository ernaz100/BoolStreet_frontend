import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    LinearProgress,
    Fade,
    Chip,
} from '@mui/material';
import { CloudUpload, FileUpload, ChangeCircle, CheckCircle } from '@mui/icons-material';

// Define props interface
interface ModelUploaderProps {
    onSuccess?: () => void;
}

// List of available tickers for selection
const AVAILABLE_TICKERS = ['MSFT', 'TSLA', 'GOOGL', 'AAPL', 'AMZN'];

// Supported file types for models and weights
const SUPPORTED_MODEL_TYPES = {
    'application/x-python-code': ['.py'],
    'application/octet-stream': ['.pt', '.pth'],
};

// Define the component
const ModelUploader: React.FC<ModelUploaderProps> = ({ onSuccess }) => {
    // State management
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [name, setName] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [tickers, setTickers] = useState<string[]>([]); // State for selected tickers
    const [tickersTouched, setTickersTouched] = useState(false); // Track if user tried to upload without tickers
    const [weightsFile, setWeightsFile] = useState<File | null>(null); // Optional weights file
    const [balance, setBalance] = useState<number>(10000); // State for balance, default 10000
    const navigate = useNavigate();
    const { token } = useAuth();

    // Dropzone configuration for model file
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
                // default name to filename if not set
                if (!name) {
                    setName(acceptedFiles[0].name);
                }
            }
        },
        accept: SUPPORTED_MODEL_TYPES,
        maxFiles: 1,
        multiple: false,
    });

    // Dropzone configuration for optional weights file
    const { getRootProps: getWeightsRootProps, getInputProps: getWeightsInputProps, isDragActive: isWeightsDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setWeightsFile(acceptedFiles[0]);
            }
        },
        accept: SUPPORTED_MODEL_TYPES,
        maxFiles: 1,
        multiple: false,
    });

    // Handle upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setTickersTouched(true); // Mark tickers as touched on upload attempt
        if (!file) {
            setStatus('Please select a file');
            return;
        }

        if (!token) {
            setStatus('Please log in to upload a model');
            return;
        }

        if (tickers.length === 0) {
            setStatus('Please select at least one ticker');
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        if (weightsFile) {
            formData.append('weights', weightsFile); // Add weights if provided
        }
        if (name) {
            formData.append('name', name);
        }
        // Add selected tickers to form data as a JSON string
        if (tickers.length > 0) {
            formData.append('tickers', JSON.stringify(tickers));
        }
        // Add balance to form data
        formData.append('balance', balance.toString());

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/models/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setProgress(100);
                setShowSuccess(true);
                // Wait for 2 seconds to show the success animation
                setTimeout(() => {
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        navigate('/my-models');
                    }
                }, 2000);
            } else {
                setStatus(`Error: ${data.error}`);
                setUploading(false);
            }
        } catch (error) {
            setStatus(`Error: ${error}`);
            setUploading(false);
        }
    };

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {/* Heading and subheading */}
            <Typography
                variant="h3"
                align="center"
                sx={{ fontWeight: 800, mb: 1, color: 'black', letterSpacing: -1 }}
            >
                Upload Your Model
            </Typography>
            <Typography
                align="center"
                sx={{ mb: 5, color: 'text.secondary', fontSize: 22 }}
            >
                Get started by uploading your first ML trading model
            </Typography>
            {/* Upload card */}
            <Card sx={{ maxWidth: 800, mx: 'auto', my: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {!file ? (
                            <Box
                                {...getRootProps()}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                                    borderRadius: 2,
                                    p: 6,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    bgcolor: isDragActive ? 'primary.light' : 'background.paper',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <input {...getInputProps()} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
                                    <Typography variant="h6">Drag & drop your code</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                                        Drop your python file here (.py)
                                    </Typography>
                                    <Button variant="outlined" startIcon={<FileUpload />} sx={{ mt: 2 }}>
                                        Select File
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderRadius: 1, borderColor: 'divider' }}>
                                    <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                                        <FileUpload sx={{ color: 'primary.main' }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" noWrap>
                                            {file.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFile(null);
                                            setName('');
                                            setWeightsFile(null); // Reset weights if model is changed
                                        }}
                                        disabled={uploading}
                                        startIcon={<ChangeCircle />}
                                    >
                                        Change
                                    </Button>
                                </Box>

                                {/* Optional weights file input */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Optional: Upload Model Weights (.pt, .pth)
                                    </Typography>
                                    {!weightsFile ? (
                                        <Box
                                            {...getWeightsRootProps()}
                                            sx={{
                                                border: '2px dashed',
                                                borderColor: isWeightsDragActive ? 'secondary.main' : 'grey.300',
                                                borderRadius: 2,
                                                p: 3,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                bgcolor: isWeightsDragActive ? 'secondary.light' : 'background.paper',
                                                '&:hover': {
                                                    borderColor: 'secondary.main',
                                                },
                                            }}
                                        >
                                            <input {...getWeightsInputProps()} />
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <CloudUpload sx={{ fontSize: 28, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Drag & drop weights file or click to select (.pt, .pth)
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: 1, borderRadius: 1, borderColor: 'divider', mt: 1 }}>
                                            <Box sx={{ bgcolor: 'secondary.light', p: 1, borderRadius: '50%' }}>
                                                <FileUpload sx={{ color: 'secondary.main' }} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" noWrap>
                                                    {weightsFile.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(weightsFile.size / 1024 / 1024).toFixed(2)} MB
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setWeightsFile(null);
                                                }}
                                                disabled={uploading}
                                                startIcon={<ChangeCircle />}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Model Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={uploading}
                                        fullWidth
                                    />

                                    {/* Balance input field */}
                                    <TextField
                                        label="Balance ($)"
                                        type="number"
                                        value={balance}
                                        onChange={(e) => setBalance(Number(e.target.value))}
                                        disabled={uploading}
                                        fullWidth
                                        inputProps={{ min: 0, step: 1000 }}
                                    />

                                    {/* Multi-select dropdown for tickers, rendered as chips */}
                                    <FormControl fullWidth disabled={uploading} error={tickersTouched && tickers.length === 0}>
                                        <InputLabel>Tickers</InputLabel>
                                        <Select
                                            multiple
                                            value={tickers}
                                            onChange={(e) => {
                                                setTickers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[]);
                                                setTickersTouched(true); // Mark as touched when user interacts
                                            }}
                                            label="Tickers"
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map((value) => (
                                                        <Chip key={value} label={value} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {AVAILABLE_TICKERS.map((ticker) => (
                                                <MenuItem key={ticker} value={ticker}>
                                                    {ticker}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {/* Show helper/error text if no ticker is selected and user tried to upload */}
                                        {tickersTouched && tickers.length === 0 && (
                                            <Typography variant="caption" color="error">Please select at least one ticker.</Typography>
                                        )}
                                    </FormControl>
                                </Box>

                                {uploading && (
                                    <Box sx={{ width: '100%' }}>
                                        <LinearProgress variant="determinate" value={progress} />
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                            {progress < 100 ? 'Uploading...' : 'Processing model...'}
                                        </Typography>
                                    </Box>
                                )}

                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleUpload}
                                    // Disable if uploading, name, or tickers are not set
                                    disabled={uploading || !name || tickers.length === 0}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Model'}
                                </Button>
                            </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Supported formats: Python scripts (.py), PyTorch (.pt, .pth)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Maximum file size: 500MB
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
            {status && <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{status}</Typography>}

            {/* Success Animation */}
            <Fade in={showSuccess}>
                <Box
                    sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        bgcolor: 'background.paper',
                        p: 4,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                    }}
                >
                    <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Upload Successful!
                    </Typography>
                </Box>
            </Fade>
        </Box>
    );
};

export default ModelUploader; 