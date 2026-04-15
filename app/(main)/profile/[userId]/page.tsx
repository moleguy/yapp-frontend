"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUser, UserMeRes } from "@/lib/api";
import UserProfileCard from "@/app/(main)/components/UserProfileCard";
import { Loader2, AlertCircle } from "lucide-react";
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
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-semibold text-white">{error || "User not found"}</h2>
                <button
                    onClick={() => router.back()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Profile</h1>
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-gray-200 text-sm"
                >
                    Back
                </button>
            </div>

            {/* Profile Card */}
            <UserProfileCard user={user} isOwnProfile={false} />

            {/* Additional Info */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                <p className="text-gray-300">
                    {user.description || "No bio provided yet"}
                </p>
            </div>
        </div>
    );
}
