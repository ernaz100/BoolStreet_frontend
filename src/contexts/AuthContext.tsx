import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface User {
    email: string;
    name: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize state from localStorage
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const fetchUserData = useCallback(async (token: string) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = response.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            // If token is invalid, clear everything
            logout();
        }
    }, [logout]);

    useEffect(() => {
        // On mount, if a token exists, always verify it by fetching user data
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserData(storedToken);
        }
    }, [fetchUserData]);

    const login = async (googleToken: string) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/auth/google`, {
                token: googleToken
            });

            const { access_token, user: userData } = response.data;

            // Store the token and user data
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(access_token);
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 