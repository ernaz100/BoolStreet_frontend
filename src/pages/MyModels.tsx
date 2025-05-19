import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Button, Dialog } from '@mui/material';
import { Add as AddIcon, TrendingUp, Speed, Psychology } from '@mui/icons-material';
import axios from 'axios';
import ModelUploader from '../components/ModelUploader';

// Interface for our script data
interface UserScript {
    id: number;
    name: string;
    active: boolean;
    created_at: string;
    balance: number;
}

const MyModels: React.FC = () => {
    const [scripts, setScripts] = useState<UserScript[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // Function to handle dialog open/close
    const handleDialogOpen = () => setOpenDialog(true);
    const handleDialogClose = () => setOpenDialog(false);

    // Function to handle model activation/deactivation
    const handleActivateModel = async (scriptId: number, currentActive: boolean) => {
        try {
            const response = await axios.post(
                `http://localhost:5005/scripts/${scriptId}/activate`,
                { active: !currentActive },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            // Update the scripts list with the new data
            setScripts(response.data.scripts);
        } catch (err) {
            setError('Failed to update model status');
        }
    };

    // Function to fetch scripts
    const fetchScripts = async () => {
        try {
            const response = await axios.get('http://localhost:5005/scripts/list', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setScripts(response.data.scripts);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch scripts');
            setLoading(false);
        }
    };

    // Function to handle successful model upload
    const handleUploadSuccess = () => {
        handleDialogClose();
        fetchScripts();
    };

    // Fetch user scripts when component mounts
    useEffect(() => {
        fetchScripts();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

            {/* Dialog for Model Uploader */}
            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '60vh',
                        maxHeight: '80vh'
                    }
                }}
            >
                <ModelUploader onSuccess={handleUploadSuccess} />
            </Dialog>

            {scripts.length === 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                        Looks empty here...
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: '400px' }}>
                        Get started by creating your first trading model. Upload your ML model and start trading automatically.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleDialogOpen}
                        size="large"
                        sx={{
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' },
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem'
                        }}
                    >
                        Create Your First Model
                    </Button>
                </Box>
            ) : (
                <>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                        gap: 3
                    }}>
                        {scripts.map((script) => (
                            <Card
                                key={script.id}
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
                                            {script.name}
                                        </Typography>
                                        <Chip
                                            label={script.active ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={script.active ? 'success' : 'default'}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TrendingUp sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Balance: ${script.balance.toFixed(2)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Speed sx={{ fontSize: 20, color: 'text.secondary', mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Created: {new Date(script.created_at).toLocaleDateString()}
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
                                            variant={script.active ? "outlined" : "contained"}
                                            size="small"
                                            fullWidth
                                            onClick={() => handleActivateModel(script.id, script.active)}
                                            sx={{
                                                textTransform: 'none',
                                                ...(script.active ? {
                                                    color: 'error.main',
                                                    borderColor: 'error.main',
                                                    '&:hover': {
                                                        borderColor: 'error.dark',
                                                        bgcolor: 'error.light',
                                                        color: 'error.dark'
                                                    }
                                                } : {
                                                    bgcolor: 'primary.main',
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark'
                                                    }
                                                })
                                            }}
                                        >
                                            {script.active ? 'Deactivate' : 'Run Model'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'left',
                        mt: 6,
                        mb: 2
                    }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleDialogOpen}
                            size="medium"
                            sx={{
                                px: 3,
                                py: 1.5,
                                fontSize: '1rem',
                                borderWidth: 2,
                                '&:hover': {
                                    borderWidth: 2
                                }
                            }}
                        >
                            Add A New Model
                        </Button>
                    </Box>
                </>
            )}
        </Container>
    );
};

export default MyModels; 