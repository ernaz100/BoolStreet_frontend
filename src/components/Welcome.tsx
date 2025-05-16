import React, { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface WelcomeProps {
    children?: ReactNode;
}

const Welcome: React.FC<WelcomeProps> = ({ children }) => {
    return (
        <Box
            id="welcome-section"
            sx={{
                width: '100%',
                minHeight: '100vh',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                bgcolor: 'background.paper',
                px: { xs: 2, md: 6 },
                py: { xs: 6, md: 10 },
            }}
        >
            {/* Left: Heading, subtext, buttons */}
            <Box>
                <Typography
                    component="h1"
                    sx={{
                        fontSize: { xs: 36, md: 56 },
                        fontWeight: 800,
                        color: 'black',
                        mb: 2,
                        lineHeight: 1.1,
                    }}
                >
                    Welcome to Boolstreet
                </Typography>
                <Typography
                    variant="h6"
                    color="grey.800"
                    sx={{ mb: 4, fontWeight: 400, maxWidth: 600 }}
                >
                    Test your trading algorithms without financial risk. Upload your ML models and compete with others using fictive currency on real market data. Track performance, refine strategies, and climb the leaderboard.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{
                            bgcolor: 'black',
                            color: 'white',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontSize: 18,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#222' },
                        }}
                    >
                        Get Started
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        sx={{
                            borderColor: 'black',
                            color: 'black',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                            px: 4,
                            py: 1.5,
                            fontSize: 18,
                            boxShadow: 'none',
                            '&:hover': { borderColor: 'black', bgcolor: '#f5f5f5' },
                        }}
                    >
                        Learn More
                    </Button>
                </Box>
            </Box>
            {/* Right: Chart or children */}
            <Box sx={{ width: '100%', display: { xs: 'none', md: 'block' } }}>{children}</Box>
        </Box>
    );
};

export default Welcome; 