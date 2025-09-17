"use client";

import React from "react";

type Friend = {
  id: string;          // unique identifier
  name: string;        // display name
  avatarUrl?: string;  // optional profile picture
  status: "online" | "offline" | "away" | "busy"; // presence
  bio?: string;        // short description
  mutualFriends?: number; // optional extra
};


interface FriendProfileProps {
  friend: Friend | null; // null when no friend is selected
}

const FriendsProfile: React.FC<FriendProfileProps> = ({ friend }) => {
  if (!friend) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a friend to view profile
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">{friend.name}</h2>
      <p className="text-gray-600">Status: {friend.status || "Unknown"}</p>
      {/* Add more friend details here later (avatar, bio, etc.) */}
    </div>
  );
};

export default FriendsProfile;
