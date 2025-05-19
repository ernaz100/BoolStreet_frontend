import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        // Check if we have a token in localStorage
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // If we have a token but no user data, try to fetch user data
            if (!user) {
                fetchUserData(storedToken);
            }
        }
    }, []);

    const fetchUserData = async (token: string) => {
        try {
            const response = await axios.get('http://localhost:5005/auth/me', {
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
    };

    const login = async (googleToken: string) => {
        try {
            const response = await axios.post('http://localhost:5005/auth/google', {
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

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
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