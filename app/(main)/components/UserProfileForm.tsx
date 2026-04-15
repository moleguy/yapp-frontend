"use client";

import React, { useState } from "react";
import { UserMeRes, UpdateUserMeReq } from "@/lib/api";
import ProfileAvatar from "./ProfileAvatar";
import { Save, X, Loader2, Twitter, Linkedin, Github, Mail } from "lucide-react";

interface UserProfileFormProps {
    user: UserMeRes;
    onSave: (updates: UpdateUserMeReq) => Promise<boolean>;
    onCancel: () => void;
    isLoading?: boolean;
}

interface SocialLinks {
    twitter?: string;
    linkedin?: string;
    github?: string;
    discord?: string;
}

interface UserProfileFormProps {
    user: UserMeRes;
    onSave: (updates: UpdateUserMeReq) => Promise<boolean>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function UserProfileForm({
    user,
    onSave,
    onCancel,
    isLoading = false,
}: UserProfileFormProps) {
    const [displayName, setDisplayName] = useState(user.display_name);
    const [description, setDescription] = useState(user.description || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
        // Load social links from localStorage
        try {
            const stored = localStorage.getItem(`social_links_${user.id}`);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const handleAvatarChange = (file: File) => {
        setAvatarFile(file);
    };

    const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
        setSocialLinks((prev) => ({
            ...prev,
            [platform]: value.trim() || undefined,
        }));
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
            // Save social links to localStorage
            localStorage.setItem(`social_links_${user.id}`, JSON.stringify(socialLinks));

            const updateData: UpdateUserMeReq = {
                display_name: displayName.trim(),
                avatar_url: user.avatar_url,
                avatar_thumbnail_url: user.avatar_thumbnail_url,
                // Note: File upload would be handled separately via EdgeStore
                // For now, we only update the metadata
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

            {/* Social Links Section */}
            <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
                <p className="text-sm text-gray-400 mb-4">Add your social media profiles (optional)</p>

                {/* Twitter */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Twitter size={16} /> Twitter
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">x.com/</span>
                        <input
                            type="text"
                            value={socialLinks.twitter || ""}
                            onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                            disabled={isSaving || isLoading}
                            placeholder="username"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* LinkedIn */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Linkedin size={16} /> LinkedIn
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">linkedin.com/in/</span>
                        <input
                            type="text"
                            value={socialLinks.linkedin || ""}
                            onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                            disabled={isSaving || isLoading}
                            placeholder="username"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* GitHub */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Github size={16} /> GitHub
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">github.com/</span>
                        <input
                            type="text"
                            value={socialLinks.github || ""}
                            onChange={(e) => handleSocialLinkChange("github", e.target.value)}
                            disabled={isSaving || isLoading}
                            placeholder="username"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Discord */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Mail size={16} /> Discord
                    </label>
                    <input
                        type="text"
                        value={socialLinks.discord || ""}
                        onChange={(e) => handleSocialLinkChange("discord", e.target.value)}
                        disabled={isSaving || isLoading}
                        placeholder="username#0000 or just username"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                </div>
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
