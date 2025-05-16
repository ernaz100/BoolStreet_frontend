import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/**
 * HowItWorks component displays the three-step process for using the platform.
 * Each step is shown as a card with an icon, title, and description.
 */
const steps = [
    {
        icon: <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Upload Your Model',
        subtitle: 'Upload your ML trading model in supported formats (Python, TensorFlow, PyTorch)',
        description:
            'Our platform accepts various model formats and provides an API for integration. You can also use our SDK to test locally before uploading.',
    },
    {
        icon: <ShowChartIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Simulate Trading',
        subtitle: 'Your model trades with $100,000 of fictive currency on real market data',
        description:
            'We run your model against historical and real-time market data. Track performance metrics, analyze trades, and refine your strategy.',
    },
    {
        icon: <EmojiEventsIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Compete & Learn',
        subtitle: "Compare your model's performance against others on the leaderboard",
        description:
            'Join competitions, climb the leaderboard, and learn from top-performing strategies. Share insights with the community.',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Box sx={{ width: '100%', py: 8, bgcolor: 'background.paper', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Section Heading */}
            <Typography
                variant="h3"
                align="center"
                sx={{ fontWeight: 800, mb: 2, color: 'black' }}
            >
                How It Works
            </Typography>
            <Typography
                align="center"
                sx={{ mb: 6, color: 'text.secondary', fontSize: 22 }}
            >
                Our platform simulates trading with your ML models using real market data but fictive currency.
            </Typography>
            {/* Responsive flex container for steps */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    justifyContent: 'center',
                    alignItems: 'stretch',
                }}
            >
                {steps.map((step) => (
                    <Box key={step.title} sx={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 4,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                p: 3,
                            }}
                        >
                            {/* Icon */}
                            <Box sx={{ mb: 2 }}>{step.icon}</Box>
                            {/* Title */}
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'black' }}>
                                {step.title}
                            </Typography>
                            {/* Subtitle */}
                            <Typography sx={{ color: 'text.secondary', fontSize: 18, mb: 1 }}>
                                {step.subtitle}
                            </Typography>
                            {/* Description */}
                            <Typography sx={{ color: 'text.secondary', fontSize: 17 }}>
                                {step.description}
                            </Typography>
                        </Card>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default HowItWorks; 