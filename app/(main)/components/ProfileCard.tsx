"use client";

import React, { useEffect, useRef } from "react";
import { IoIosClose } from "react-icons/io";
import { Friend } from "@/app/(main)/components/FriendsProfile";
import Image from "next/image";
import { RiMessage3Fill } from "react-icons/ri";
import { UserCheck } from "lucide-react";

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
            className="bg-white shadow-lg w-[640px] max-w-full relative p-8 border border-[#dcd9d3] rounded-3xl"
            onClick={(e) => e.stopPropagation()}
        >
          <button
              onClick={handleCloseClick}
              className="absolute top-1 right-1 text-gray-600 hover:text-[#1e1e1e] cursor-pointer z-10"
          >
            <IoIosClose className="w-8 h-8" />
          </button>

          <div className="flex flex-col items-start text-center">
            <div className="w-full h-40 bg-green-800 rounded-t-2xl">banner</div>
            <Image
                src={friend.avatarUrl || "/icons/default-avatar.png"}
                alt={friend.name}
                width={90}
                height={90}
                className="absolute top-30 left-12 w-32 h-32 rounded-full object-cover mb-2 bg-gray-200"
            />

            <div className={`flex flex-col justify-center items-start w-full py-8 px-8 border-b border-l border-r border-t-0 rounded-b-xl border-[#dcd9d3]`}>

              <label className="text-xl font-semibold mt-12">{friend.name}</label>
              {friend.username && (
                  <p className="text-sm text-gray-600">@{friend.username}</p>
              )}

              {friend.memberSince && (
                  <p className="mt-3 text-base text-gray-700">
                    Member since {friend.memberSince}
                  </p>
              )}

              {friend.mutualServers !== undefined && (
                  <p className="mt-2 text-base text-gray-700">
                    Mutual Servers: {friend.mutualServers}
                  </p>
              )}

              {friend.mutualFriends !== undefined && (
                  <p className="mt-1 text-base text-gray-700">
                    Mutual Friends: {friend.mutualFriends}
                  </p>
              )}

              <div className={`flex gap-4 items-center mt-8 px-2 py-2`}>
                <button
                    className={`flex items-center gap-2 border border-[#dcd9d3] py-2 px-3 focus:outline-none rounded-xl cursor-pointer hover:bg-[#DCDCDC] text-[#1e1e1e]`}
                >
                  <RiMessage3Fill  className={`w-6 h-6`}/>
                  Message
                </button>

                <button
                  className={` border border-[#dcd9d3] py-2 px-3 rounded-xl hover:bg-[#DCDCDC] cursor-pointer`}
                >
                  <UserCheck className={`w-6 h-6`}/>
                </button>

              </div>
            </div>


          </div>
        </div>
      </div>
  );
}