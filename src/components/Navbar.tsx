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
    Divider,
} from '@mui/material';
import { AutoGraph, Logout, VpnKey, AccountCircle } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

// Define navigation links for authenticated users
const authenticatedNavLinks: Array<{ label: string; path: string; isScroll?: boolean; sectionId?: string }> = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Traders', path: '/traders' },
    { label: 'Market Data', path: '/market-data' },
    { label: 'Leaderboard', path: '/leaderboard' },
];

// Define navigation links for non-authenticated users
const nonAuthenticatedNavLinks: Array<{ label: string; path: string; isScroll?: boolean; sectionId?: string }> = [
    { label: 'How It Works', path: '/', isScroll: true, sectionId: 'how-it-works-section' },
    { label: 'Pricing', path: '/', isScroll: true, sectionId: 'pricing-section' },
    { label: 'FAQ', path: '/', isScroll: true, sectionId: 'faq-section' },
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
            // Redirect to brokers page after successful login
            navigate('/brokers');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    // Determine which navigation links to show based on authentication status
    const navLinks = user ? authenticatedNavLinks : nonAuthenticatedNavLinks;

    const handleNavClick = (link: { label: string; path: string; isScroll?: boolean; sectionId?: string }) => {
        if (link.isScroll && link.sectionId) {
            const sectionId = link.sectionId; // Store in local variable for TypeScript
            if (location.pathname === '/') {
                // Scroll to the section on the landing page
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Navigate to landing page, then scroll after a brief delay
                navigate('/');
                setTimeout(() => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        } else {
            navigate(link.path);
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
                        onClick={() => navigate(user ? '/dashboard' : '/')}
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
                                onClick={() => handleNavClick(link)}
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
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/brokers');
                                            handleMenuClose();
                                        }}
                                        sx={{ gap: 1 }}
                                    >
                                        <VpnKey fontSize="small" />
                                        Brokers
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/manage-account');
                                            handleMenuClose();
                                        }}
                                        sx={{ gap: 1 }}
                                    >
                                        <AccountCircle fontSize="small" />
                                        Manage Account
                                    </MenuItem>
                                    <Divider />
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