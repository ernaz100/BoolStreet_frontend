import React from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { EmojiEvents, TrendingUp, Star } from '@mui/icons-material';

// Mock data for top performers
const topPerformers = [
    {
        rank: 1,
        name: 'John Doe',
        avatar: 'JD',
        model: 'Quantum Predictor',
        accuracy: '92%',
        profit: '+$45,678',
        winRate: '85%',
    },
    {
        rank: 2,
        name: 'Jane Smith',
        avatar: 'JS',
        model: 'Neural Net Alpha',
        accuracy: '89%',
        profit: '+$38,942',
        winRate: '82%',
    },
    {
        rank: 3,
        name: 'Mike Johnson',
        avatar: 'MJ',
        model: 'AI Trader Pro',
        accuracy: '87%',
        profit: '+$32,156',
        winRate: '79%',
    },
    {
        rank: 4,
        name: 'Sarah Wilson',
        avatar: 'SW',
        model: 'Market Master',
        accuracy: '85%',
        profit: '+$28,934',
        winRate: '77%',
    },
    {
        rank: 5,
        name: 'David Brown',
        avatar: 'DB',
        model: 'Smart Predictor',
        accuracy: '83%',
        profit: '+$25,678',
        winRate: '75%',
    },
];

const Leaderboard: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
                Leaderboard
            </Typography>

            {/* Top 3 Performers */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                {topPerformers.slice(0, 3).map((performer) => (
                    <Card
                        key={performer.rank}
                        elevation={0}
                        sx={{
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            overflow: 'visible',
                        }}
                    >
                        {performer.rank === 1 && (
                            <EmojiEvents
                                sx={{
                                    position: 'absolute',
                                    top: -20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    fontSize: 40,
                                    color: '#FFD700',
                                }}
                            />
                        )}
                        <CardContent sx={{ pt: performer.rank === 1 ? 4 : 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: performer.rank === 1 ? 'primary.main' : 'grey.200',
                                        color: performer.rank === 1 ? 'white' : 'text.primary',
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {performer.avatar}
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {performer.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {performer.model}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Profit
                                        </Typography>
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                            {performer.profit}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Star sx={{ color: 'warning.main', mr: 1 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Win Rate
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {performer.winRate}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            {/* Full Leaderboard Table */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Full Rankings
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Trader</TableCell>
                            <TableCell>Model</TableCell>
                            <TableCell align="right">Accuracy</TableCell>
                            <TableCell align="right">Profit</TableCell>
                            <TableCell align="right">Win Rate</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {topPerformers.map((performer) => (
                            <TableRow key={performer.rank}>
                                <TableCell>
                                    <Chip
                                        label={`#${performer.rank}`}
                                        size="small"
                                        color={performer.rank <= 3 ? 'primary' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: performer.rank <= 3 ? 'primary.main' : 'grey.200',
                                                color: performer.rank <= 3 ? 'white' : 'text.primary',
                                                fontSize: '0.875rem',
                                                mr: 1,
                                            }}
                                        >
                                            {performer.avatar}
                                        </Avatar>
                                        {performer.name}
                                    </Box>
                                </TableCell>
                                <TableCell>{performer.model}</TableCell>
                                <TableCell align="right">{performer.accuracy}</TableCell>
                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                    {performer.profit}
                                </TableCell>
                                <TableCell align="right">{performer.winRate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Leaderboard; 