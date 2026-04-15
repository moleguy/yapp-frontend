"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserMe, updateUserMe, UpdateUserMeReq, UserMeRes } from "@/lib/api";
import UserProfileForm from "@/app/(main)/components/UserProfileForm";
import { Loader2, AlertCircle } from "lucide-react";

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserMeRes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            setLoading(true);
            setError(null);
            try {
                const userData = await getUserMe();
                if (userData) {
                    setUser(userData);
                } else {
                    setError("Failed to load profile");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const handleSave = async (updates: UpdateUserMeReq): Promise<boolean> => {
        try {
            setSaveMessage(null);
            const result = await updateUserMe(updates);
            if (result) {
                setUser((prev) => (prev ? { ...prev, ...result } : null));
                setSaveMessage("Profile updated successfully");
                setTimeout(() => setSaveMessage(null), 3000);
                return true;
            } else {
                setError("Failed to update profile");
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
            return false;
        }
    };

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
                <h2 className="text-xl font-semibold text-white">{error || "Unable to load profile"}</h2>
                <button
                    onClick={() => router.push("/home")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                <p className="text-gray-400 mt-2">Edit your profile information</p>
            </div>

            {/* Success Message */}
            {saveMessage && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded">
                    {saveMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Current Profile Preview */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Current Profile</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl">
                        {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white font-semibold">{user.display_name}</p>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                </div>
            </div>

            {/* Profile Edit Form */}
            <UserProfileForm
                user={user}
                onSave={handleSave}
                onCancel={() => router.back()}
            />

            {/* Security Section */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Security Settings</h2>
                <p className="text-gray-400 text-sm">
                    For email and username changes, contact support.
                </p>
                <button
                    onClick={() => {
                        // TODO: Implement password change modal
                        alert("Password change coming soon");
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                    Change Password
                </button>
            </div>
        </div>
    );
}
