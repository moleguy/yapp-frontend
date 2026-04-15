"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Mail, User } from "lucide-react";
import { UserMeRes } from "@/lib/api";
import SocialLinksDisplay from "./SocialLinksDisplay";

interface UserProfileCardProps {
    user: UserMeRes;
    isOwnProfile?: boolean;
    onEditClick?: () => void;
}

export default function UserProfileCard({
    user,
    isOwnProfile = false,
    onEditClick,
}: UserProfileCardProps) {
    const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
            {/* Header Background */}
            <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600" />

            {/* Profile Content */}
            <div className="px-6 pb-6">
                {/* Avatar Section */}
                <div className="flex items-end gap-4 -mt-16 mb-4">
                    {user.avatar_thumbnail_url ? (
                        <Image
                            src={user.avatar_thumbnail_url}
                            alt={user.display_name}
                            width={120}
                            height={120}
                            className="w-24 h-24 rounded-full border-4 border-gray-900 object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-gray-900 bg-gray-800 flex items-center justify-center text-3xl">
                            {user.display_name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isOwnProfile && onEditClick && (
                        <button
                            onClick={onEditClick}
                            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* User Info */}
                <div className="space-y-2 mb-4">
                    <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
                    <p className="text-gray-400">@{user.username}</p>
                    {user.description && (
                        <p className="text-gray-300 my-3">{user.description}</p>
                    )}
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail size={16} />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={16} />
                        <span>Joined {joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <User size={16} />
                        <span className={user.active ? "text-green-500" : "text-gray-500"}>
                            {user.active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center pt-4 border-t border-gray-700">
                    <SocialLinksDisplay userId={user.id} className="mt-4" />
                </div>
            </div>
        </div>
    );
}
