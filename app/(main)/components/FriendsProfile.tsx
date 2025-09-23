"use client";

import React from "react";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";

export type Friend = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  status: "online" | "offline" ;
  mutualFriends?: number;
  mutualServers?: number;
  memberSince?: string; // format: "10 Jan 2019"
};

const FriendsProfile: React.FC<{ friend: Friend | null }> = ({ friend }) => {
  if (!friend) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-[#7e7f87] p-4 text-center">
            <p className="text-lg mb-2">It's quiet in here...</p>
            <p className="text-sm">Select a friend to start chatting</p>
        </div>
    );
  }

  return (
      <div className="w-full h-full bg-[#fbfbfb] flex flex-col">
          <div className={`flex-1 overflow-y-auto border-b border-[#dcd9d3]`}>
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
                          {/* Status icon */}
                          <span className="absolute bottom-1 right-3 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                            <GoDotFill className={`w-10 h-10 ${friend.status === "online" ? "text-[#08CB00]" : "text-[#7e7f87]"}`}/>
                          </span>
                      </div>
                  </div>
              </div>

              {/* Details */}
              <div className="px-4 pt-14 pb-4 bg-[#fbfbfb]">
                  <h2 className="text-2xl font-semibold text-[#1e1e1e] tracking-wide">
                      {friend.name}
                  </h2>
                  {friend.username && (
                      <p className="font-base text-[#1e1e1e]">@{friend.username}</p>
                  )}

                  {friend.memberSince && (
                      <div className="mt-4 border rounded-lg border-[#dcd9d3] p-3 flex flex-col gap-2">
                          <h3 className="text-sm font-medium text-[#1e1e1e]">Member Since</h3>
                          <p className="text-sm text-[#1e1e1e]">{friend.memberSince}</p>
                      </div>
                  )}

                  {friend.mutualServers !== undefined && (
                      <div className="mt-3 gap-1 border rounded-lg border-[#dcd9d3] p-3 flex justify-start items-center cursor-pointer hover:bg-gray-50">
                        <span className="text-sm font-base text-[#1e1e1e] tracking-wide">
                            Mutual Servers — {friend.mutualServers}
                        </span>
                      </div>
                  )}

                  {friend.mutualFriends !== undefined && (
                      <div className="mt-2 gap-1 border rounded-lg border-[#dcd9d3] p-3 flex justify-start items-center cursor-pointer hover:bg-gray-50">
                        <span className="text-sm font-base text-[#1e1e1e] tracking-wide">
                            Mutual Friends — {friend.mutualFriends}
                        </span>
                      </div>
                  )}
              </div>
          </div>

          {/* Footer - always at bottom */}
          <div className="border rounded-lg border-[#dcd9d3] p-4 text-center text-[#1e1e1e] cursor-pointer hover:bg-gray-50 flex-shrink-0 m-4">
              View full profile
          </div>
      </div>
  );
};

export default FriendsProfile;
