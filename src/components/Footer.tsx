import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

/**
 * Footer component for the Boolstreet homepage.
 * Displays copyright and legal links in a clean, responsive layout.
 */
const Footer: React.FC = () => {
    return (
        <Box
            component="footer"
            sx={{
                width: '100%',
                borderTop: '1px solid',
                borderColor: 'divider',
                py: 3,
                mt: 8,
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    {/* Left: Copyright */}
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 15 }}>
                        © 2025 Boolstreet. All rights reserved.
                    </Typography>
                    {/* Right: Terms and Privacy links */}
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Link href="#" underline="hover" color="text.secondary" sx={{ fontSize: 15 }}>
                            Terms
                        </Link>
                        <Link href="#" underline="hover" color="text.secondary" sx={{ fontSize: 15 }}>
                            Privacy
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer; 