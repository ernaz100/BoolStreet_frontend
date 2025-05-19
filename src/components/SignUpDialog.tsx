import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

const SignUpDialog: React.FC = () => {
    const { login } = useAuth();

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await login(credentialResponse.credential);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <Dialog
            open={true}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                Sign in to continue
            </DialogTitle>
            <DialogContent sx={{ pb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <DialogContentText sx={{ mb: 3, textAlign: 'center' }}>
                    Please sign in to access this feature
                </DialogContentText>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        console.log('Login Failed');
                    }}
                    theme="filled_black"
                    text="signin"
                    shape="pill"
                    width="240"
                    type="standard"
                />
            </DialogContent>
        </Dialog>
    );
};

export default SignUpDialog; 