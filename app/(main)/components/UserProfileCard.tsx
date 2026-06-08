"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Mail, User } from "lucide-react";
import { UserMeRes } from "@/lib/api";
import SocialLinksDisplay from "./SocialLinksDisplay";
import { useFriendsStore } from "@/app/store/useFriendsStore";
import { useUser } from "@/app/store/useUserStore";
import { useDialog } from "@/app/contexts/DialogContext";

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
  const { confirm } = useDialog();
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
    if (!(await confirm({ message: `Unfriend ${user.display_name}?`, destructive: true, confirmLabel: "Unfriend" }))) return;
    setFriendActionLoading(true);
    await removeFriend(user.id);
    setFriendActionLoading(false);
  };

  return (
    <div className="bg-surface-elevated rounded-lg overflow-hidden border border-default shadow-lg">
      <div className="h-32 bg-gradient-to-r from-primary to-purple-600" />

      <div className="px-6 pb-6">
        <div className="flex items-end gap-4 -mt-16 mb-4">
          {user.avatar_thumbnail_url ? (
            <Image
              src={user.avatar_thumbnail_url}
              alt={`${user.display_name}'s user profile picture`}
              width={120}
              height={120}
              className="w-24 h-24 rounded-full border-4 border-default object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-default bg-surface-inverse flex items-center justify-center text-3xl">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="ml-auto flex gap-2">
            {!isOwnProfile && currentUser && user.id !== currentUser.id && (
              user.is_friend ? (
                <button
                  onClick={handleUnfriend}
                  disabled={friendActionLoading}
                  className="bg-surface-neutral hover:bg-divider text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Unfriend
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  disabled={friendActionLoading}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  Add Friend
                </button>
              )
            )}
            {isOwnProfile && onEditClick && (
              <button
                onClick={onEditClick}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
          <p className="text-faint">@{user.username}</p>
          {user.description && <p className="text-soft my-3">{user.description}</p>}
          {user.friend_count !== undefined && (
            <p className="text-sm text-faint">{user.friend_count} friends</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {isOwnProfile && (
            <div className="flex items-center gap-2 text-faint text-sm">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-faint text-sm">
            <Calendar size={16} />
            <span>Joined {joinDate}</span>
          </div>
          <div className="flex items-center gap-2 text-faint text-sm">
            <User size={16} />
            <span className={user.active ? "text-green-500" : "text-list-muted"}>
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center pt-4 border-t border-neutral">
          <SocialLinksDisplay appLinks={user.app_links} className="mt-4" />
        </div>
      </div>
    </div>
  );
}
