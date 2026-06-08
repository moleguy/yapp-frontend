'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from './FeedbackStates';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-app">
                <LoadingState message="Loading…" fullHeight={false} />
            </div>
        );
    }

    if (!user) {

        return null; // Don’t render children while redirecting
    }

    return <>{children}</>;
}
