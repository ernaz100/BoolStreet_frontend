import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Container,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import { AutoGraph, Logout } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Models', path: '/my-models' },
    { label: 'Market Data', path: '/market-data' },
    { label: 'Leaderboard', path: '/leaderboard' },
];

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        handleMenuClose();
        navigate('/');
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await login(credentialResponse.credential);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

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
                    {/* Auth BTN*/}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {user ? (
                            <>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        cursor: 'pointer',
                                        '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={handleMenuOpen}
                                >
                                    <Avatar
                                        src={user.picture}
                                        alt={user.name}
                                        sx={{ width: 32, height: 32 }}
                                    />
                                    <Typography sx={{ color: 'black', fontWeight: 500 }}>
                                        Hello, {user.name}
                                    </Typography>
                                </Box>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    PaperProps={{
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                                            mt: 1.5,
                                            '& .MuiAvatar-root': {
                                                width: 32,
                                                height: 32,
                                                ml: -0.5,
                                                mr: 1,
                                            },
                                        },
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    <MenuItem onClick={handleLogout} sx={{ gap: 1 }}>
                                        <Logout fontSize="small" />
                                        Logout
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                theme="filled_black"
                                text="signin"
                                shape="pill"
                                width="120"
                                type="standard"
                            />
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar; 