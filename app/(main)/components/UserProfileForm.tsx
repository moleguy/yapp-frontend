"use client";

import React, { useState, useEffect } from "react";
import { UserMeRes, UpdateUserMeReq, AppProvider, upsertAppLink, deleteAppLink } from "@/lib/api";
import ProfileAvatar from "./ProfileAvatar";
import { Save, X, Loader2 } from "lucide-react";

interface UserProfileFormProps {
    user: UserMeRes;
    onSave: (updates: UpdateUserMeReq) => Promise<boolean>;
    onCancel: () => void;
    isLoading?: boolean;
}

interface AppLinkFields {
  spotify?: string;
  reddit?: string;
  twitter?: string;
  steam?: string;
}

const APP_LINK_PROVIDERS: { key: AppProvider; label: string }[] = [
  { key: "twitter", label: "Twitter / X" },
  { key: "reddit", label: "Reddit" },
  { key: "spotify", label: "Spotify" },
  { key: "steam", label: "Steam" },
];

export default function UserProfileForm({
    user,
    onSave,
    onCancel,
    isLoading = false,
}: UserProfileFormProps) {
    const [displayName, setDisplayName] = useState(user.display_name);
    const [description, setDescription] = useState(user.description || "");

    // Sync form state with user prop (reflects server response)
    useEffect(() => {
        setDisplayName(user.display_name);
        setDescription(user.description || "");
    }, [user.display_name, user.description]);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appLinks, setAppLinks] = useState<AppLinkFields>(() => {
        const fields: AppLinkFields = {};
        (user.app_links || []).forEach((link) => {
            if (link.provider in fields || APP_LINK_PROVIDERS.some((p) => p.key === link.provider)) {
                fields[link.provider as keyof AppLinkFields] = link.url;
            }
        });
        return fields;
    });

    const handleAvatarChange = (file: File) => {
        setAvatarFile(file);
    };

    const handleAppLinkChange = (provider: AppProvider, value: string) => {
        setAppLinks((prev) => ({ ...prev, [provider]: value.trim() || undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!displayName.trim()) {
            setError("Display name is required");
            return;
        }

        setIsSaving(true);
        try {
            for (const { key } of APP_LINK_PROVIDERS) {
                const url = appLinks[key];
                if (url) {
                    await upsertAppLink({ provider: key, url, show_on_profile: true });
                } else if ((user.app_links || []).some((l) => l.provider === key)) {
                    await deleteAppLink(key);
                }
            }

            const updateData: UpdateUserMeReq = {
                display_name: displayName.trim(),
                description: description.trim() || null,
                avatar_url: user.avatar_url,
                avatar_thumbnail_url: user.avatar_thumbnail_url,
            };

            const success = await onSave(updateData);
            if (success) {
                onCancel(); // Close form on success
            } else {
                setError("Failed to save profile");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg border border-gray-800 p-6 space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Avatar Section */}
            <div className="flex justify-center">
                <ProfileAvatar
                    currentAvatar={user.avatar_thumbnail_url}
                    displayName={displayName}
                    onAvatarChange={handleAvatarChange}
                    isLoading={isSaving || isLoading}
                />
            </div>

            {/* Display Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSaving || isLoading}
                    maxLength={50}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Enter your display name"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {displayName.length}/50
                </p>
            </div>

            {/* Bio/Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving || isLoading}
                    maxLength={500}
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                    placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500
                </p>
            </div>

            {/* App Links */}
            <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">App Links</h3>
                <p className="text-sm text-gray-400 mb-4">Full profile URLs (optional)</p>
                {APP_LINK_PROVIDERS.map(({ key, label }) => (
                    <div key={key} className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                        <input
                            type="url"
                            value={appLinks[key] || ""}
                            onChange={(e) => handleAppLinkChange(key, e.target.value)}
                            disabled={isSaving || isLoading}
                            placeholder={`https://${key}.com/...`}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                ))}
            </div>

            {/* Read-only Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-700">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        value={user.username}
                        disabled
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Contact support to change</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
                >
                    <X size={18} />
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={isSaving || isLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
