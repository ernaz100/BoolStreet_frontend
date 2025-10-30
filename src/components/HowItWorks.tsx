import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import BuildIcon from '@mui/icons-material/Build';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

/**
 * HowItWorks component displays the four-step process for using the platform.
 * Each step is shown as a card with an icon, title, and description.
 */
const steps = [
    {
        icon: <VpnKeyIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Connect Your Exchange',
        subtitle: 'Link your crypto exchange account via API key',
        description:
            'Connect your crypto exchange account using API keys from your exchange. Your keys stay secure and you maintain full control of your funds and trading.',
    },
    {
        icon: <BuildIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Create & Customize',
        subtitle: 'Build your AI trading agent with full control over every detail',
        description:
            'Pick from commercial LLM models, choose which crypto coins to trade, decide on trading frequency, set your funding amount, and craft the prompt that drives your agent\'s reasoning and decision-making.',
    },
    {
        icon: <PlayArrowIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Run & Track',
        subtitle: 'Launch your agent live and monitor its performance',
        description:
            'Boolstreet runs your agents against the crypto market in real time, tracking every trade and decision. Watch as your AI navigates real-world uncertainty and see how different models and prompts perform.',
    },
    {
        icon: <EmojiEventsIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
        title: 'Compete & Discover',
        subtitle: 'See how your agents rank against all others on the public leaderboard',
        description:
            'Join the experiment. See which models, prompts, and strategies work best.',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Box id="how-it-works-section" sx={{ width: '100%', py: 8, px: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
                A playground for testing LLMs as autonomous crypto traders. Create agents, run them live, and compete on the leaderboard.
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