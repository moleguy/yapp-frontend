"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserMe, updateUserMe, UpdateUserMeReq, UserMeRes } from "@/lib/api";
import UserProfileForm from "@/app/(main)/components/UserProfileForm";
import { useDialog } from "@/app/contexts/DialogContext";
import { LoadingState, ErrorState } from "@/app/(main)/components/FeedbackStates";

export default function ProfileSettingsPage() {
    const router = useRouter();
    const { alert: showAlert } = useDialog();
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
                // Update user state with server response
                // This ensures the form reflects the actual server-saved values
                setUser((prev) =>
                    prev ? {
                        ...prev,
                        display_name: result.display_name,
                        avatar_url: result.avatar_url,
                        avatar_thumbnail_url: result.avatar_thumbnail_url,
                    } : null
                );
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
        return <LoadingState message="Loading profile…" />;
    }

    if (error || !user) {
        return (
            <ErrorState
                title="Unable to load profile"
                message={error || "Something went wrong while loading your profile."}
                action={{ label: "Go Home", onClick: () => router.push("/home") }}
            />
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-heading">Profile Settings</h1>
                <p className="text-faint mt-2">Edit your profile information</p>
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
            <div className="bg-surface-elevated rounded-lg border border-default p-6">
                <h2 className="text-lg font-semibold text-heading mb-4">Current Profile</h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-inverse flex items-center justify-center text-2xl">
                        {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-heading font-semibold">{user.display_name}</p>
                        <p className="text-faint text-sm">@{user.username}</p>
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
            <div className="bg-surface-elevated rounded-lg border border-default p-6 space-y-4">
                <h2 className="text-lg font-semibold text-heading">Security Settings</h2>
                <p className="text-faint text-sm">
                    For email and username changes, contact support.
                </p>
                <button
                    onClick={() => void showAlert({
                        title: "Coming soon",
                        message: "Password change coming soon",
                    })}
                    className="bg-surface-inverse hover:bg-surface-neutral text-heading px-4 py-2 rounded-lg transition"
                >
                    Change Password
                </button>
            </div>
        </div>
    );
}
