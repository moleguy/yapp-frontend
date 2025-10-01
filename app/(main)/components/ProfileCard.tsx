"use client";

import React, { useEffect, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { Friend } from "@/app/(main)/components/FriendsProfile";
import Image from "next/image";

type ProfileCardProps = {
  friend: Friend;
  isOpen: boolean;
  onCloseAction?: () => void;
};

export default function ProfileCard({
                                      friend,
                                      isOpen,
                                      onCloseAction,
                                    }: ProfileCardProps) {
  const profileRef = useRef<HTMLDivElement | null>(null);

  // Safe close function
  const handleClose = () => {
    if (typeof onCloseAction === 'function') {
      onCloseAction();
    } else {
      console.warn('onCloseAction is not a function');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
          profileRef.current &&
          !profileRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
      <div
          className="fixed inset-0 flex items-center justify-center bg-black/30 bg-opacity-50 z-50"
          onClick={handleBackdropClick}
      >
        <div
            ref={profileRef}
            className="bg-white shadow-lg w-[540px] max-w-full relative p-6 border border-[#dcd9d3] rounded-xl"
            onClick={(e) => e.stopPropagation()}
        >
          <button
              onClick={handleCloseClick}
              className="absolute top-1 right-1 text-gray-600 hover:text-[#1e1e1e] cursor-pointer z-10"
          >
            <IoIosClose className="w-8 h-8" />
          </button>

          <div className="flex flex-col items-start text-center">
            <div className="w-full h-40 bg-black rounded-lg mb-20">banner</div>
            <Image
                src={friend.avatarUrl || "/icons/default-avatar.png"}
                alt={friend.name}
                width={90}
                height={90}
                className="absolute top-30 left-12 w-32 h-32 rounded-full object-cover mb-4 bg-gray-500"
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