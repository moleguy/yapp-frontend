'use client';
import {createContext, useContext, useState, useEffect, ReactNode, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {
    authSignIn,
    authSignUp,
    authSignOut,
    getUserMe,
    SignInReq,
    SignUpReq,
    UserProfile,
} from '@/lib/api';

export interface AuthError {
    message: string;
    code?: string;
    statusCode?: number;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    error: AuthError | null;
    signin: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
    signup: (userData: SignUpReq) => Promise<{ success: boolean; error?: AuthError }>;
    signout: () => Promise<void>;
    refetch: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AuthError | null>(null);
    const router = useRouter();

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleError = useCallback((error: unknown, defaultMessage: string): AuthError => {
        if (error instanceof Error) {
            return {
                message: error.message,
                code: 'UNKNOWN_ERROR'
            };
        }

        if (typeof error === 'object' && error !== null) {
            const apiError = error as any;
            return {
                message: apiError.message || defaultMessage,
                code: apiError.code,
                statusCode: apiError.statusCode
            };
        }

        return {
            message: defaultMessage,
            code: 'UNKNOWN_ERROR'
        };
    }, []);

    // Fetch user
    const fetchUser = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            clearError();

            const userData = await getUserMe();
            setUser(userData);
        } catch (error) {
            console.error('Error fetching user:', error);
            const authError = handleError(error, 'Failed to fetch user data');
            setError(authError);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [handleError, clearError]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // SignIn
    const signin = useCallback(async (email: string, password: string) => {
        try {
            setLoading(true);
            clearError();

            if (!email?.trim() || !password?.trim()) {
                const validationError: AuthError = {
                    message: 'Email and password are required',
                    code: 'VALIDATION_ERROR'
                };
                setError(validationError);
                return {success: false, error: validationError};
            }

            const payload: SignInReq = {
                email: email.trim(),
                password: password
            };

            const result = await authSignIn(payload);

            if ('success' in result && result.success) {
                await fetchUser(false);
                console.log('User after signin:', user); //NOTE: Debug log, remove in production
                return {success: true};
            } else {
                const errorMessage = 'message' in result ? result.message : 'Invalid credentials';
                const authError: AuthError = {
                    message: errorMessage ?? 'Invalid credentials',
                    code: 'SIGNIN_FAILED',
                    statusCode: 'statusCode' in result && typeof result.statusCode === 'number' ? result.statusCode : undefined
                };
                setError(authError);
                return {success: false, error: authError};
            }
        } catch (error) {
            const authError = handleError(error, 'SignIn failed');
            setError(authError);
            return {success: false, error: authError};
        } finally {
            setLoading(false);
        }
    }, [fetchUser, handleError, clearError, user]);

    // SignUp
    const signup = useCallback(async (userData: SignUpReq) => {
        try {
            setLoading(true);
            clearError();

            if (!userData.email?.trim()) {
                const validationError: AuthError = {
                    message: 'Email is required',
                    code: 'VALIDATION_ERROR'
                };
                setError(validationError);
                return {success: false, error: validationError};
            }

            const result = await authSignUp(userData);

            if ('success' in result && result.success) {
                return {success: true};
            } else {
                const errorMessage = 'message' in result ? result.message : 'SignUp failed';
                const authError: AuthError = {
                    message: errorMessage ?? 'Invalid credentials',
                    code: 'SIGNUP_FAILED',
                    statusCode: 'statusCode' in result && typeof result.statusCode === 'number' ? result.statusCode : undefined
                };
                setError(authError);
                return {success: false, error: authError};
            }
        } catch (error) {
            const authError = handleError(error, 'SignUp failed');
            setError(authError);
            return {success: false, error: authError};
        } finally {
            setLoading(false);
        }
    }, [handleError, clearError]);

    // Signout
    const signout = useCallback(async () => {
        try {
            setLoading(true);
            clearError();

            await authSignOut();
        } catch (error) {
            console.error('Signout error:', error);
            // Don't show error to user for signout - just log it
        } finally {
            setUser(null);
            setLoading(false);
            router.push('/signin');
        }
    }, [router, clearError]);

    // Refetch user data
    const refetch = useCallback(() => fetchUser(true), [fetchUser]);

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        error,
        signin,
        signup,
        signout,
        refetch,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Custom hook for auth status only 
export const useAuthStatus = () => {
    const {isAuthenticated, loading} = useAuth();
    return {isAuthenticated, loading};
};

//  Custom hook for protected routes
export const useRequireAuth = (redirectTo = '/signin') => {
    const {isAuthenticated, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, loading, router, redirectTo]);

    return {isAuthenticated, loading};
};