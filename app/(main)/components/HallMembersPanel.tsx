"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { HallMember, Role } from "@/lib/api";
import { usePresenceByUserId } from "@/app/store/usePresenceStore";
import {
  isPresenceActive,
  presenceBgClass,
  resolvePresenceStatus,
} from "@/lib/presenceUtils";
import { EmptyState, LoadingState } from "@/app/(main)/components/FeedbackStates";
import { Users } from "lucide-react";
import MemberProfilePopover, {
  type MemberProfileTarget,
} from "@/app/(main)/components/MemberProfilePopover";

type Props = {
  members: HallMember[];
  roles?: Role[];
  currentUserId?: string;
  loading?: boolean;
};

function memberDisplayName(member: HallMember): string {
  return (
    member.nickname ||
    member.user?.display_name ||
    member.user?.username ||
    `User ${member.user_id.slice(0, 8)}`
  );
}

type MemberRowProps = {
  member: HallMember;
  status: ReturnType<typeof resolvePresenceStatus>;
  isCurrentUser: boolean;
  onOpenProfile: (member: HallMember, status: ReturnType<typeof resolvePresenceStatus>, rect: DOMRect) => void;
};

function MemberRow({ member, status, isCurrentUser, onOpenProfile }: MemberRowProps) {
  const name = memberDisplayName(member);
  const avatarUrl = member.user?.avatar_thumbnail_url || member.user?.avatar_url;

  return (
    <button
      type="button"
      onClick={(e) => onOpenProfile(member, status, e.currentTarget.getBoundingClientRect())}
      className="flex w-full items-center gap-3 rounded-lg py-2 px-3 text-left text-list-muted transition-colors cursor-pointer hover:bg-list-hover hover:text-list-emphasis"
    >
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${name}'s user profile picture`}
            width={40}
            height={40}
            unoptimized
            className="w-10 h-10 rounded-full object-cover bg-surface-placeholder"
          />
        ) : (
          <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center text-white font-medium">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div
          className={`absolute -bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${presenceBgClass(status)}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-md font-medium truncate text-list-emphasis">
          {name}
          {isCurrentUser && <span className="font-normal text-list-muted"> (You)</span>}
        </p>
        {member.user?.username && (
          <p className="text-xs truncate text-list-muted">@{member.user.username}</p>
        )}
      </div>
    </button>
  );
}

export default function HallMembersPanel({
  members,
  roles = [],
  currentUserId,
  loading = false,
}: Props) {
  const presenceByUserId = usePresenceByUserId();
  const [profileTarget, setProfileTarget] = useState<MemberProfileTarget | null>(null);

  const membersWithStatus = useMemo(
    () =>
      members.map((member) => ({
        member,
        status: resolvePresenceStatus(member.user_id, presenceByUserId, member.presence),
      })),
    [members, presenceByUserId]
  );

  const activeMembers = useMemo(
    () => membersWithStatus.filter((row) => isPresenceActive(row.status)),
    [membersWithStatus]
  );
  const offlineMembers = useMemo(
    () => membersWithStatus.filter((row) => !isPresenceActive(row.status)),
    [membersWithStatus]
  );

  const handleOpenProfile = (
    member: HallMember,
    status: ReturnType<typeof resolvePresenceStatus>,
    anchorRect: DOMRect
  ) => {
    setProfileTarget({ member, status, anchorRect });
  };

  if (loading) {
    return <LoadingState message="Loading members…" fullHeight={false} className="py-12" />;
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="No members"
        description="This hall has no members yet."
        icon={<Users className="w-7 h-7" />}
        fullHeight={false}
        className="py-8"
      />
    );
  }

  return (
    <>
      <div className="py-6 px-3">
        <label className="text-sm px-3 font-base text-list-muted tracking-wide mb-2 block">
          Online — {activeMembers.length}
        </label>
        <div className="space-y-2 mb-8">
          {activeMembers.length === 0 ? (
            <p className="px-3 text-sm text-list-muted">No one is online right now.</p>
          ) : (
            activeMembers.map(({ member, status }) => (
              <MemberRow
                key={member.id}
                member={member}
                status={status}
                isCurrentUser={member.user_id === currentUserId}
                onOpenProfile={handleOpenProfile}
              />
            ))
          )}
        </div>

        <label className="text-sm px-3 font-base text-list-muted tracking-wide mb-2 block">
          Offline — {offlineMembers.length}
        </label>
        <div className="space-y-2">
          {offlineMembers.map(({ member, status }) => (
            <MemberRow
              key={member.id}
              member={member}
              status={status}
              isCurrentUser={member.user_id === currentUserId}
              onOpenProfile={handleOpenProfile}
            />
          ))}
        </div>
      </div>

      <MemberProfilePopover
        target={profileTarget}
        roles={roles}
        onClose={() => setProfileTarget(null)}
      />
    </>
  );
}
