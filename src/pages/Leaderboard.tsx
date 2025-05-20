import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, AlertTitle, Button, Divider } from '@mui/material';
import { EmojiEvents, TrendingUp, Star, Refresh, Person } from '@mui/icons-material';
import axios from 'axios';

// Define interface for leaderboard data
interface LeaderboardEntry {
    rank: number | null;
    name: string;
    avatar: string | null;  // Can be URL to profile picture or initials
    model: string;
    accuracy: string;
    profit: string;
    winRate: string;
    isCurrentUser?: boolean;
}

interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    currentUser: LeaderboardEntry | null;
}

const Leaderboard: React.FC = () => {
    // State for leaderboard data
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch leaderboard data
    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setLeaderboardData(response.data);
        } catch (err) {
            setError('Unable to fetch leaderboard data. This could be due to a temporary service disruption or network issue.');
            console.error('Error fetching leaderboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboardData();
        // Refresh data every 5 minutes
        const interval = setInterval(fetchLeaderboardData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        '& .MuiAlert-message': {
                            width: '100%'
                        }
                    }}
                >
                    <AlertTitle>Leaderboard Data Unavailable</AlertTitle>
                    {error}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Refresh />}
                            onClick={fetchLeaderboardData}
                            sx={{ mt: 1 }}
                        >
                            Retry
                        </Button>
                    </Box>
                </Alert>
            </Container>
        );
    }

    const topPerformers = leaderboardData?.leaderboard || [];
    const currentUser = leaderboardData?.currentUser;

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
                            <TableRow key={performer.rank || 'unranked'}>
                                <TableCell>
                                    <Chip
                                        label={`#${performer.rank || 'NA'}`}
                                        size="small"
                                        color={performer.rank && performer.rank <= 3 ? 'primary' : 'default'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                bgcolor: performer.rank && performer.rank <= 3 ? 'primary.main' : 'grey.200',
                                                color: performer.rank && performer.rank <= 3 ? 'white' : 'text.primary',
                                                fontSize: '0.875rem',
                                                mr: 1,
                                            }}
                                            src={performer.avatar?.startsWith('http') ? performer.avatar : undefined}
                                        >
                                            {!performer.avatar?.startsWith('http') && performer.avatar}
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

                        {/* Current User Row (if not in top performers) */}
                        {currentUser && !topPerformers.some(p => p.isCurrentUser) && (
                            <>
                                <TableRow>
                                    <TableCell colSpan={6}>
                                        <Divider />
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell>
                                        <Chip
                                            label={currentUser.rank ? `#${currentUser.rank}` : '#NA'}
                                            size="small"
                                            color="secondary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    bgcolor: 'secondary.main',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    mr: 1,
                                                }}
                                                src={currentUser.avatar?.startsWith('http') ? currentUser.avatar : undefined}
                                            >
                                                {!currentUser.avatar?.startsWith('http') ? <Person /> : null}
                                            </Avatar>
                                            {currentUser.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{currentUser.model}</TableCell>
                                    <TableCell align="right">{currentUser.accuracy}</TableCell>
                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                        {currentUser.profit}
                                    </TableCell>
                                    <TableCell align="right">{currentUser.winRate}</TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Leaderboard; 