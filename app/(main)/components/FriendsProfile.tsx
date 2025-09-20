"use client";

import React from "react";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";

export type Friend = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  status: "online" | "offline" | "away" | "busy";
  mutualFriends?: number;
  mutualServers?: number;
  memberSince?: string; // format: "10 Jan 2019"
};

const FriendsProfile: React.FC<{ friend: Friend | null }> = ({ friend }) => {
  if (!friend) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a friend to view profile
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full mx-auto bg-white">
      {/* Background banner for image */}
      <div className="relative">
        <div className="h-32 bg-[#3A6F43]" />
        <div className="absolute -bottom-12 left-4">
          <div className="relative">
            {/* User's Avatar */}
            <Image
              src={friend.avatarUrl || "/icons/default-avatar.png"}
              alt={friend.name}
              width={100}
              height={100}
              className="rounded-full bg-[#DCDCDC] m-3 object-cover"
            />
            {/* Status icon: Online or Offline status */}
            <span className="absolute bottom-1 right-3 w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <GoDotFill className="w-10 h-10 text-[#08CB00]" />
            </span>
          </div>
        </div>
      </div>

      {/* Details for user's profile */}
      <div className="px-4 pt-14 pb-6 h-full bg-[#fbfbfb]">
        <h2 className="text-2xl font-semibold text-[#1e1e1e] tracking-wide">{friend.name}</h2>
        {friend.username && (
          <p className=" font-base text-[#1e1e1e]">{friend.username}</p>
        )}

        {friend.memberSince && (
          <div className="mt-4 border rounded-lg border-[#dcd9d3] p-3">
            <h3 className="text-sm font-medium text-[#1e1e1e]">Member Since</h3>
            <p className="text-sm text-[#1e1e1e]">{friend.memberSince}</p>
          </div>
        )}

        {friend.mutualServers !== undefined && (
          <div className="mt-3 gap-1 border rounded-lg border-[#dcd9d3] p-3 flex justify-start items-center cursor-pointer hover:bg-gray-50">
            <span className="text-sm font-medium ">
              Mutual Servers
            </span>
            <span>—</span>
            <span className="text-sm text-[#1e1e1e]">
              {friend.mutualServers} →
            </span>
          </div>
        )}

        {friend.mutualFriends !== undefined && (
          <div className="mt-2 gap-1 border rounded-lg border-[#dcd9d3] p-3 flex justify-start items-center cursor-pointer hover:bg-gray-50">
            <span className="text-sm font-medium text-[#1e1e1e] tracking-wide">
              Mutual Friends
            </span>
            <span>—</span>
            <span className="text-sm text-[#1e1e1e]">
              {friend.mutualFriends} →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsProfile;
