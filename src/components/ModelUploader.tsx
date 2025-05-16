import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
} from '@mui/material';
import { CloudUpload, FileUpload, ChangeCircle } from '@mui/icons-material';

// Define the component
const ModelUploader: React.FC = () => {
    // State management
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [modelType, setModelType] = useState('');
    const [modelName, setModelName] = useState('');

    // Dropzone configuration
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0]);
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
    const handleUpload = () => {
        if (!file || !modelType || !modelName) return;

        setUploading(true);

        // Simulate upload progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 5;
            });
        }, 300);

        // Simulate upload completion
        setTimeout(() => {
            clearInterval(interval);
            setProgress(100);

            setTimeout(() => {
                setUploading(false);
                setFile(null);
                setProgress(0);
                setModelName('');
                setModelType('');
            }, 1000);
        }, 3000);
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
                                        onClick={() => setFile(null)}
                                        disabled={uploading}
                                        startIcon={<ChangeCircle />}
                                    >
                                        Change
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Model Name"
                                        value={modelName}
                                        onChange={(e) => setModelName(e.target.value)}
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
                                    disabled={uploading || !modelType || !modelName}
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
        </Box>
    );
};

export default ModelUploader; 