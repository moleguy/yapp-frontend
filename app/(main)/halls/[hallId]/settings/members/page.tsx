"use client";

import React, { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  useHallMembers,
  useHallRoles,
  useSelectHall,
  useSelectedHall
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import MembersList from "@/app/(main)/halls/components/MembersList";
import { kickHallMember, updateHallMemberRole, updateHallMemberNickname, banUser } from "@/lib/api";
import { usePresenceSync } from "@/app/hooks/usePresenceSync";

export default function HallMembersSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const members = useHallMembers();
  const roles = useHallRoles();
  const user = useUser();
  const memberUserIds = useMemo(() => members.map((m) => m.user_id), [members]);
  usePresenceSync(memberUserIds);

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  const handleKick = async (memberId: string) => {
    if (!hallId) return;
    try {
      const success = await kickHallMember(hallId, memberId);
      if (success) {
        // Refresh members list
        selectHall(hallId);
      }
    } catch (error) {
      console.error("Failed to kick member:", error);
    }
  };

  const handleUpdateNickname = async (memberId: string, nickname: string | null) => {
    if (!hallId) return;
    try {
      const updated = await updateHallMemberNickname(hallId, memberId, { nickname });
      if (updated) selectHall(hallId);
    } catch (error) {
      console.error("Failed to update nickname:", error);
    }
  };

  const handleBan = async (userId: string) => {
    if (!hallId) return;
    try {
      const success = await banUser(hallId, { user_id: userId, reason: "Banned by moderator" });
      if (success) selectHall(hallId);
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUpdateRole = async (memberId: string, roleId: string) => {
    if (!hallId) return;
    try {
      const updated = await updateHallMemberRole(hallId, memberId, { role_id: roleId });
      if (updated) selectHall(hallId);
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-default rounded-xl overflow-hidden">
        <MembersList
          members={members}
          roles={roles}
          onKick={handleKick}
          onUpdateRole={handleUpdateRole}
          onUpdateNickname={handleUpdateNickname}
          onBan={handleBan}
          currentUserId={user?.id}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
