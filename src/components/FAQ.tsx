import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const faqItems = [
    {
        question: 'Can I change plans later?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes, we offer a 3-day free trial on all paid plans, backed by our 100% money-back guarantee.',
    },
    {
        question: 'What kind of support do you offer?',
        answer: 'Free plan users get email support, while Pro and Enterprise users get priority support with faster response times.',
    },
];

const FAQ: React.FC = () => {
    return (
        <Box id="faq-section" sx={{ pt: 10, pb: 0, bgcolor: 'background.default' }}>
            <Container maxWidth="lg" sx={{ pb: 10 }}>
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'black' }}>
                        Frequently Asked Questions
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, 1fr)',
                        },
                        gap: 4,
                        maxWidth: 800,
                        mx: 'auto',
                    }}
                >
                    {faqItems.map((faq) => (
                        <Box
                            key={faq.question}
                            sx={{
                                textAlign: 'left',
                                p: 3,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                {faq.question}
                            </Typography>
                            <Typography color="text.secondary">{faq.answer}</Typography>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
};

export default FAQ;

