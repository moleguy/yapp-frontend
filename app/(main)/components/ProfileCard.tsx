"use client";

import React, {useState, useEffect, useRef} from 'react';
import {IoIosClose} from "react-icons/io";
import { Friend } from "@/app/(main)/components/FriendsProfile";

type ProfileCardProps = {
    friend: Friend;
    isOpen: () => void;
    onClose: () => void;
}

export default function ProfileCard({friend, isOpen, onClose}: ProfileCardProps ){

    const profileRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if(!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if(
                profileRef.current &&
                profileRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        }

        window.addEventListener("mousedown", handleClickOutside);

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    return(
        <div
            ref={profileRef}
            className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50">
            {/* Modal */}
            <div className="bg-white shadow-lg w-[400px] max-w-full relative p-6  border border-[#dcd9d3] rounded-xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-600 hover:text-[#1e1e1e] cursor-pointer"
                >
                    <IoIosClose className="w-8 h-8" />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    <img
                        src={friend.avatarUrl || "/icons/default-avatar.png"}
                        alt={friend.name}
                        className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                    <h2 className="text-xl font-semibold">{friend.name}</h2>
                    {friend.username && (
                        <p className="text-sm text-gray-600">@{friend.username}</p>
                    )}

                    {friend.memberSince && (
                        <p className="mt-3 text-sm text-gray-700">
                            Member since {friend.memberSince}
                        </p>
                    )}

                    {friend.mutualServers !== undefined && (
                        <p className="mt-2 text-sm text-gray-700">
                            Mutual Servers: {friend.mutualServers}
                        </p>
                    )}

                    {friend.mutualFriends !== undefined && (
                        <p className="mt-1 text-sm text-gray-700">
                            Mutual Friends: {friend.mutualFriends}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}