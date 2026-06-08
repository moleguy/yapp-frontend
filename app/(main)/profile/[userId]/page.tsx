"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUser, UserMeRes } from "@/lib/api";
import UserProfileCard from "@/app/(main)/components/UserProfileCard";
import { LoadingState, ErrorState } from "@/app/(main)/components/FeedbackStates";
import { useRouter } from "next/navigation";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [user, setUser] = useState<UserMeRes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const loadUser = async () => {
            setLoading(true);
            setError(null);
            try {
                const userData = await getUser(userId);
                if (userData) {
                    setUser(userData);
                } else {
                    setError("User not found");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load user");
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [userId]);

    if (loading) {
        return <LoadingState message="Loading profile…" />;
    }

    if (error || !user) {
        return (
            <ErrorState
                title="User not found"
                message={error || "This profile could not be loaded."}
                action={{ label: "Go Back", onClick: () => router.back() }}
            />
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-heading">Profile</h1>
                <button
                    onClick={() => router.back()}
                    className="text-faint hover:text-soft text-sm"
                >
                    Back
                </button>
            </div>

            {/* Profile Card */}
            <UserProfileCard user={user} isOwnProfile={false} />

            {/* Additional Info */}
            <div className="bg-surface-elevated rounded-lg border border-default p-6">
                <h2 className="text-lg font-semibold text-heading mb-4">About</h2>
                <p className="text-soft">
                    {user.description || "No bio provided yet"}
                </p>
            </div>
        </div>
    );
}
