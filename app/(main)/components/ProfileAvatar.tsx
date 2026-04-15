"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

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
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
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
            {/* Avatar Display */}
            <div className="relative w-32 h-32">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={displayName}
                        fill
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-4xl text-gray-600">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Upload Button Overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-full transition"
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
                <p className="text-sm text-gray-400">JPG, PNG, GIF up to 5MB</p>
            </div>

            {/* Remove Preview Button */}
            {preview && (
                <button
                    onClick={handleRemovePreview}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 disabled:opacity-50 text-sm"
                >
                    <X size={16} />
                    Remove
                </button>
            )}
        </div>
    );
}
