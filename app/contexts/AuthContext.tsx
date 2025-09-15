'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    authSignin,
    authSignup,
    authSignout,
    getCurrentUser,
    SigninReq,
    SignupReq,
    UserProfile
} from '../../lib/api';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signin: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (userData: Omit<SignupReq, 'username_or_email'>) => Promise<{ success: boolean; error?: string }>;
    signout: () => Promise<void>;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Check authentication status on mount
    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signin = async (usernameOrEmail: string, password: string) => {
        try {
            setLoading(true);

            const payload: SigninReq = {
                username_or_email: usernameOrEmail,
                password: password
            };

            const result = await authSignin(payload);

            // Check if signin was successful
            if ('success' in result && result.success) {
                // After successful signin, fetch user data
                await fetchUser();
                return { success: true };
            } else {
                return { success: false, error: 'Signin failed' };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Signin failed';
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData: Omit<SignupReq, 'username_or_email'>) => {
        try {
            setLoading(true);

            const result = await authSignup(userData);

            if ('success' in result && result.success) {
                // After successful signup, you might want to automatically sign in
                // or redirect to signin page
                return { success: true };
            } else {
                return { success: false, error: 'Signup failed' };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Signup failed';
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const signout = async () => {
        try {
            setLoading(true);
            await authSignout();
        } catch (error) {
            console.error('Signout error:', error);
        } finally {
            setUser(null);
            setLoading(false);
            router.push('/signin');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signin,
            signup,
            signout,
            refetch: fetchUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};