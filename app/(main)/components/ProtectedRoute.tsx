'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [loading, user, router]);

    if (loading) {
        return <p>Loading...</p>; // Or a spinner component
    }

    if (!user) {
        if (typeof window !== "undefined") {
            window.location.href = "/signin";
        }
        return null; // Don’t render children while redirecting
    }

    return <>{children}</>;
}
