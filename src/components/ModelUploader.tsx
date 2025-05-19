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
    SelectChangeEvent,
    TextField,
    Typography,
    LinearProgress,
    Fade,
} from '@mui/material';
import { CloudUpload, FileUpload, ChangeCircle, CheckCircle } from '@mui/icons-material';

// Define the component
const ModelUploader: React.FC = () => {
    // State management
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [modelType, setModelType] = useState('');
    const [name, setName] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();

    // Dropzone configuration
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
        accept: {
            'application/x-python-code': ['.py'],
            'application/octet-stream': ['.h5', '.pkl', '.pt', '.pth', '.onnx'],
            'application/zip': ['.zip'],
        },
        maxFiles: 1,
        multiple: false,
    });

    // Handle model type change
    const handleModelTypeChange = (event: SelectChangeEvent) => {
        setModelType(event.target.value);
    };

    // Handle upload
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setStatus('Please select a file');
            return;
        }

        if (!token) {
            setStatus('Please log in to upload a model');
            return;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        if (name) {
            formData.append('name', name);
        }
        if (modelType) {
            formData.append('model_type', modelType);
        }

        try {
            const response = await fetch('http://localhost:5005/scripts', {
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
                    navigate('/my-models');
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
                                    <Typography variant="h6">Drag & drop your model file</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                                        Upload your ML model file (.py, .h5, .pkl, .pt, .pth, .onnx) or a zip archive containing your model
                                        and dependencies
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
                                        }}
                                        disabled={uploading}
                                        startIcon={<ChangeCircle />}
                                    >
                                        Change
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Model Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={uploading}
                                        fullWidth
                                    />

                                    <FormControl fullWidth disabled={uploading}>
                                        <InputLabel>Model Type</InputLabel>
                                        <Select value={modelType} onChange={handleModelTypeChange} label="Model Type">
                                            <MenuItem value="classification">Classification</MenuItem>
                                            <MenuItem value="regression">Regression</MenuItem>
                                            <MenuItem value="reinforcement">Reinforcement Learning</MenuItem>
                                            <MenuItem value="custom">Custom Algorithm</MenuItem>
                                        </Select>
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
                                    disabled={uploading || !modelType || !name}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Model'}
                                </Button>
                            </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Supported formats: Python scripts (.py), TensorFlow (.h5), PyTorch (.pt, .pth), ONNX (.onnx), Pickle
                                (.pkl), or ZIP archives
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Maximum file size: 500MB
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Powered by Boolstreet
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