import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StockChart from './components/StockChart';
import Navbar from './components/Navbar';
import Welcome from './components/Welcome';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Traders from './pages/Traders';
import MarketData from './pages/MarketData';
import Leaderboard from './pages/Leaderboard';
import Brokers from './pages/Brokers';
import ManageAccount from './pages/ManageAccount';
import SignUpDialog from './components/SignUpDialog';

// Create a theme instance
const theme = createTheme({
    palette: {
        primary: {
            main: '#10b981',
        },
        background: {
            default: '#f5f5f5',
            paper: '#fff',
        },
        text: {
            primary: '#111',
            secondary: '#444',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        fontWeightBold: 800,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
            },
        },
    },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <SignUpDialog />;
};


const AppContent: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    minHeight: '100vh'
                }}>
                    <Navbar />
                    <Box sx={{ flexGrow: 1, pt: 8 }}>
                        <Routes>
                            <Route path="/" element={
                                <>
                                    <Welcome>
                                        <StockChart />
                                    </Welcome>
                                    <HowItWorks />
                                    <Pricing />
                                    <FAQ />
                                </>
                            } />
                            <Route path="/brokers" element={<ProtectedRoute> <Brokers /> </ProtectedRoute>} />
                            <Route path="/manage-account" element={<ProtectedRoute> <ManageAccount /> </ProtectedRoute>} />
                            <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
                            <Route path="/traders" element={<ProtectedRoute> <Traders /> </ProtectedRoute>} />
                            <Route path="/market-data" element={<ProtectedRoute> <MarketData /> </ProtectedRoute>} />
                            <Route path="/leaderboard" element={<ProtectedRoute> <Leaderboard /> </ProtectedRoute>} />
                        </Routes>
                    </Box>
                    <Footer />
                </Box>
            </Router>
        </ThemeProvider>
    );
};

const App: React.FC = () => {
    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
};

export default App; 