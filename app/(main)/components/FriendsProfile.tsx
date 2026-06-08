"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { FiChevronRight } from "react-icons/fi";
import ProfileCard from "@/app/(main)/components/ProfileCard";
import { useFriendsStore } from "@/app/store/useFriendsStore";
import { UserPublic } from "@/lib/api";

export type Friend = {
  id: string;
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
  const [showMutualFriends, setShowMutualFriends] = useState(false);
  const [mutualFriends, setMutualFriends] = useState<UserPublic[]>([]);
  const fetchMutualFriends = useFriendsStore((s) => s.fetchMutualFriends);

  useEffect(() => {
    if (!friend?.id) return;
    fetchMutualFriends(friend.id).then(setMutualFriends);
  }, [friend?.id, fetchMutualFriends]);

  if (!friend) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#7e7f87] p-4 text-center">
        <p className="text-lg mb-2">It&apos;s quiet in here...</p>
        <p className="text-sm">Select a friend to start chatting</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#fbfbfb] flex flex-col select-none">
      <div className="flex-1 overflow-y-auto border-b border-[#dcd9d3]">
        <div className="relative">
          <div className="h-32 bg-[#3A6F43]" />
          <div className="absolute top-15 left-4">
            <div className="relative">
              {friend.avatarUrl ? (
                <Image
                  src={friend.avatarUrl}
                  alt={friend.name}
                  width={100}
                  height={100}
                  className="rounded-full bg-[#DCDCDC] m-3 object-cover"
                />
              ) : (
                <div className="w-[100px] h-[100px] rounded-full bg-[#DCDCDC] m-3 flex items-center justify-center text-3xl font-medium">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-1 right-3 w-7 h-7 rounded-full bg-[#fbfbfb] flex items-center justify-center">
                <GoDotFill
                  className={`w-10 h-10 ${
                    friend.status === "online" ? "text-[#08CB00]" : "text-[#7e7f87]"
                  }`}
                />
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 pt-14 pb-4 bg-[#fbfbfb]">
          <h2 className="text-2xl font-semibold text-[#1e1e1e] tracking-wide">{friend.name}</h2>
          {friend.username && (
            <p className="font-base text-[#1e1e1e]">@{friend.username}</p>
          )}

          <div className="mt-4 border rounded-lg border-[#dcd9d3] p-3">
            <p className="text-sm text-[#73726e]">
              Direct messages are not available yet. View your friend&apos;s profile below.
            </p>
          </div>

          {(mutualFriends.length > 0 || friend.mutualFriends !== undefined) && (
            <div className="mt-2 border rounded-lg border-[#dcd9d3] p-3 cursor-pointer hover:bg-gray-50">
              <div
                onClick={() => setShowMutualFriends((prev) => !prev)}
                className="flex items-center justify-between"
              >
                <span className="text-sm font-base text-[#1e1e1e] tracking-wide">
                  Mutual Friends — {mutualFriends.length || friend.mutualFriends || 0}
                </span>
                <FiChevronRight
                  className={`w-5 h-5 text-[#7e7f87] transition-transform duration-200 ${
                    showMutualFriends ? "rotate-90" : ""
                  }`}
                />
              </div>

              {showMutualFriends && (
                <div className="mt-3 flex flex-col gap-2 pl-2">
                  {mutualFriends.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-[#1e1e1e]">
                      {f.avatar_thumbnail_url ? (
                        <Image
                          src={f.avatar_thumbnail_url}
                          alt={f.display_name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                          {f.display_name.charAt(0)}
                        </div>
                      )}
                      {f.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
