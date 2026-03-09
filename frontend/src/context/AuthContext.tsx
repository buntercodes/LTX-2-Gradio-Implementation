"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { Models, OAuthProvider } from 'appwrite';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    isLoading: boolean;
    isLoggingIn: boolean;
    loginWithGoogle: () => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            // Check for OAuth callback parameters in URL
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            const secret = urlParams.get('secret');

            if (userId && secret) {
                try {
                    // Manually create session from URL tokens for instant initialization
                    await account.createSession(userId, secret);
                    // Clear the sensitive params from the URL without reloading
                    const newUrl = window.location.pathname + window.location.hash;
                    window.history.replaceState({}, '', newUrl);
                } catch (sessionError) {
                    console.error('Failed to create session from tokens:', sessionError);
                }
            }

            const currentUser = await account.get();
            setUser(currentUser);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const loginWithGoogle = async () => {
        setIsLoggingIn(true);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            // createOAuth2Token is faster than createOAuth2Session as it avoids one intermediate redirect
            const redirectUrl = await account.createOAuth2Token(
                OAuthProvider.Google,
                `${origin}/dashboard`,
                `${origin}/auth`
            );
            if (redirectUrl) {
                window.location.href = redirectUrl as string;
            }
        } catch (error) {
            console.error('Google login failed:', error);
            setIsLoggingIn(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await account.deleteSession('current');
            setUser(null);
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isLoggingIn, loginWithGoogle, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
