"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Mail, User } from "lucide-react";
import { UserMeRes } from "@/lib/api";
import SocialLinksDisplay from "./SocialLinksDisplay";
import { useFriendsStore } from "@/app/store/useFriendsStore";
import { useUser } from "@/app/store/useUserStore";

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
  const currentUser = useUser();
  const addFriend = useFriendsStore((s) => s.addFriend);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleAddFriend = async () => {
    setFriendActionLoading(true);
    await addFriend(user.id);
    setFriendActionLoading(false);
  };

  const handleUnfriend = async () => {
    if (!window.confirm(`Unfriend ${user.display_name}?`)) return;
    setFriendActionLoading(true);
    await removeFriend(user.id);
    setFriendActionLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
      <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600" />

      <div className="px-6 pb-6">
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
          <div className="ml-auto flex gap-2">
            {!isOwnProfile && currentUser && user.id !== currentUser.id && (
              user.is_friend ? (
                <button
                  onClick={handleUnfriend}
                  disabled={friendActionLoading}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Unfriend
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={friendActionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Add Friend
                </button>
              )
            )}
            {isOwnProfile && onEditClick && (
              <button
                onClick={onEditClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
          <p className="text-gray-400">@{user.username}</p>
          {user.description && <p className="text-gray-300 my-3">{user.description}</p>}
          {user.friend_count !== undefined && (
            <p className="text-sm text-gray-400">{user.friend_count} friends</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {isOwnProfile && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          )}
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

        <div className="flex items-center justify-center pt-4 border-t border-gray-700">
          <SocialLinksDisplay appLinks={user.app_links} className="mt-4" />
        </div>
      </div>
    </div>
  );
}
