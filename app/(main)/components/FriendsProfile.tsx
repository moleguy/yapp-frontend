"use client";

import React, { useState } from "react";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { FiChevronRight } from "react-icons/fi";
import ProfileCard from "@/app/(main)/components/ProfileCard";

export type Friend = {
  id: number;
  name: string;
  username?: string;
  avatarUrl?: string;
  status?: "online" | "offline";
  mutualFriends?: number;
  mutualServers?: number;
  memberSince?: string;
  tags?: string;
};

const FriendsProfile: React.FC<{ friend: Friend | null }> = ({ friend }) => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showMutualServers, setShowMutualServers] = useState(false);
  const [showMutualFriends, setShowMutualFriends] = useState(false);

  // Mock data for display
  const mockMutualServers = [
    { id: 1, name: "Art & Design" },
    { id: 2, name: "Gamers Hub" },
    { id: 3, name: "Music Lounge" },
  ];

  const mockMutualFriends = [
    { id: 1, name: "Manish Lama", avatarUrl: "/icons/default-avatar.png" },
    { id: 2, name: "Sandesh Tiwari", avatarUrl: "/icons/default-avatar.png" },
    { id: 3, name: "Nischal Magar", avatarUrl: "/icons/default-avatar.png" },
  ];

  if (!friend) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-[#7e7f87] p-4 text-center">
          <p className="text-lg mb-2">It&apos;s quiet in here...</p>
          <p className="text-sm">Select a friend to start chatting</p>
        </div>
    );
  }

  const toggleServers = () => setShowMutualServers((prev) => !prev);
  const toggleFriends = () => setShowMutualFriends((prev) => !prev);

  return (
      <div className="w-full h-full bg-[#fbfbfb] flex flex-col select-none">
        <div className="flex-1 overflow-y-auto border-b border-[#dcd9d3]">
          <div className="relative">
            <div className="h-32 bg-[#3A6F43]" />
            <div className="absolute -bottom-12 left-4">
              <div className="relative">
                {/* User Avatar */}
                <Image
                    src={friend.avatarUrl || "/icons/default-avatar.png"}
                    alt={friend.name}
                    width={100}
                    height={100}
                    className="rounded-full bg-[#DCDCDC] m-3 object-cover"
                />
                {/* Status indicator */}
                <span className="absolute bottom-1 right-3 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <GoDotFill
                    className={`w-10 h-10 ${
                        friend.status === "online"
                            ? "text-[#08CB00]"
                            : "text-[#7e7f87]"
                    }`}
                />
              </span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-4 pt-14 pb-4 bg-[#fbfbfb]">
            <h2 className="text-2xl font-semibold text-[#1e1e1e] tracking-wide">
              {friend.name}
            </h2>
            {friend.username && (
                <p className="font-base text-[#1e1e1e]">@{friend.username}</p>
            )}

            {friend.memberSince && (
                <div className="mt-4 border rounded-lg border-[#dcd9d3] p-3 flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-[#1e1e1e]">
                    Member Since
                  </h3>
                  <p className="text-sm text-[#1e1e1e]">{friend.memberSince}</p>
                </div>
            )}

            {/* Mutual Servers */}
            {friend.mutualServers !== undefined && (
                <div className="mt-3 border rounded-lg border-[#dcd9d3] p-3 cursor-pointer hover:bg-gray-50">
                  <div
                      onClick={toggleServers}
                      className="flex items-center justify-between">
                    <span className="text-sm font-base text-[#1e1e1e] tracking-wide">
                      Mutual Servers — {friend.mutualServers}
                    </span>
                    <FiChevronRight className={`w-5 h-5 text-[#7e7f87] transition-transform duration-200 ${showMutualServers ? "rotate-90" : ""}`}/>
                  </div>

                  {showMutualServers && (
                      <div className="mt-3 flex flex-col gap-2 pl-2 transition-all duration-200 ease-in-out">
                        {mockMutualServers.map((server) => (
                            <div
                                key={server.id}
                                className="text-lg text-[#1e1e1e] flex items-center gap-2 tracking-wide font-medium"
                            >
                              <div className="w-14 h-14 bg-[#3A6F43] text-white rounded-full flex items-center justify-center text-xs">
                                {server.name.charAt(0)}
                              </div>
                              {server.name}
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            )}

            {/* Mutual Friends */}
            {friend.mutualFriends !== undefined && (
                <div className="mt-2 border rounded-lg border-[#dcd9d3] p-3 cursor-pointer hover:bg-gray-50">
                  <div
                      onClick={toggleFriends}
                      className="flex items-center justify-between"
                  >
                    <span

                        className="text-sm font-base text-[#1e1e1e] tracking-wide"
                    >
                      Mutual Friends — {friend.mutualFriends}
                    </span>
                    <FiChevronRight
                        className={`w-5 h-5 text-[#7e7f87] transition-transform duration-200 ${
                            showMutualFriends ? "rotate-90" : ""
                        }`}
                    />
                  </div>

                  {showMutualFriends && (
                      <div className="mt-3 flex flex-col gap-2 pl-2 transition-all duration-200 ease-in-out">
                        {mockMutualFriends.map((f) => (
                            <div
                                key={f.id}
                                className="flex items-center gap-2 text-sm text-[#1e1e1e]"
                            >
                              <Image
                                  src={f.avatarUrl}
                                  alt={f.name}
                                  width={64}
                                  height={64}
                                  className="rounded-full bg-black object-cover"
                              />
                              {f.name}
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <button
            onClick={() => setShowProfileCard(true)}
            className="border rounded-lg border-[#dcd9d3] p-4 text-center text-[#1e1e1e] cursor-pointer hover:bg-[#f2f2f3] flex-shrink-0 m-4"
        >
          View full profile
        </button>

        {showProfileCard && (
            <ProfileCard
                friend={friend}
                isOpen={showProfileCard}
                onCloseAction={() => setShowProfileCard(false)}
            />
        )}
      </div>
  );
};

export default FriendsProfile;
