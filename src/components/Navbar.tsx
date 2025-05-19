import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
} from '@mui/material';
import { AutoGraph } from '@mui/icons-material';

const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Models', path: '/my-models' },
    { label: 'Market Data', path: '/market-data' },
    { label: 'Leaderboard', path: '/leaderboard' },
];

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <AppBar
            // Always sticky at the top
            position="fixed"
            color="transparent"
            elevation={2}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#fff',
                top: 0,
                zIndex: 1201,
                transition: 'box-shadow 0.2s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
        >
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ minHeight: 72 }}>
                    {/* Logo */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mr: 4,
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate('/')}
                    >
                        <AutoGraph sx={{ color: 'black', fontSize: 28 }} />
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 700, color: 'black', fontSize: 24 }}
                        >
                            Boolstreet
                        </Typography>
                    </Box>
                    {/* Centered nav links */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 3 }}>
                        {navLinks.map((link) => (
                            <Typography
                                key={link.label}
                                onClick={() => navigate(link.path)}
                                sx={{
                                    fontWeight: location.pathname === link.path ? 700 : 500,
                                    color: location.pathname === link.path ? 'black' : 'grey.600',
                                    fontSize: 18,
                                    mx: 2,
                                    cursor: 'pointer',
                                    transition: 'color 0.2s',
                                    '&:hover': { color: 'black' },
                                }}
                            >
                                {link.label}
                            </Typography>
                        ))}
                    </Box>
                    {/* Auth buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: 'black',
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 2.5,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: '#222' },
                            }}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar; 