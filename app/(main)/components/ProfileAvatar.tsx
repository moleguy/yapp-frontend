"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useDialog } from "@/app/contexts/DialogContext";

interface ProfileAvatarProps {
    currentAvatar?: string | null;
    displayName: string;
    onAvatarChange: (file: File) => void;
    isLoading?: boolean;
}

export default function ProfileAvatar({
    currentAvatar,
    displayName,
    onAvatarChange,
    isLoading = false,
}: ProfileAvatarProps) {
    const { alert: showAlert } = useDialog();
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            await showAlert("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            await showAlert("File size must be less than 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Call callback
        onAvatarChange(file);
    };

    const handleRemovePreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const displayImage = preview || currentAvatar;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* User profile picture */}
            <div className="relative w-32 h-32">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={`${displayName}'s user profile picture`}
                        fill
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-surface-inverse flex items-center justify-center text-4xl text-secondary">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Upload Button Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute bottom-0 right-0 bg-primary hover:bg-primary-hover disabled:bg-divider text-white p-2 rounded-full transition"
                >
                    <Upload size={20} />
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isLoading}
            />

            {/* File Info */}
            <div className="text-center">
                <p className="text-sm text-faint">JPG, PNG, GIF up to 5MB</p>
            </div>

            {/* Remove Preview Button */}
            {preview && (
                <button
                    onClick={handleRemovePreview}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-destructive hover:opacity-80 disabled:opacity-50 text-sm"
                >
                    <X size={16} />
                    Remove
                </button>
            )}
        </div>
    );
}
