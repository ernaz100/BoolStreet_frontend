import { Container, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ModelUploader from './components/ModelUploader';
import StockChart from './components/StockChart';
import Navbar from './components/Navbar';
import Welcome from './components/Welcome';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';

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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{
                display: 'flex', flexDirection: 'column', bgcolor: 'background.paper',
                minHeight: '100vh'
            }}>
                <Navbar />
                <Welcome>
                    <StockChart />
                </Welcome>
                <HowItWorks />
                <Box sx={{ flexGrow: 1, py: 6 }}>
                    <Container maxWidth="lg">
                        <ModelUploader />
                    </Container>
                </Box>
                <Footer />
            </Box>
        </ThemeProvider>
    );
}

export default App; 