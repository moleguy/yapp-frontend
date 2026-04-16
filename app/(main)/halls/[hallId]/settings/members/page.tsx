"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useHallMembers,
  useHallRoles,
  useSelectHall,
  useSelectedHall
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import MembersList from "@/app/(main)/halls/components/MembersList";
import { kickHallMember, updateHallMember } from "@/lib/api";

export default function HallMembersSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const members = useHallMembers();
  const roles = useHallRoles();
  const user = useUser();

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  const handleKick = async (userId: string) => {
    if (!hallId) return;
    try {
      const success = await kickHallMember(hallId, userId);
      if (success) {
        // Refresh members list
        selectHall(hallId);
      }
    } catch (error) {
      console.error("Failed to kick member:", error);
    }
  };

  const handleUpdateRole = async (userId: string, roleId: string) => {
    if (!hallId) return;
    try {
      const updated = await updateHallMember(hallId, userId, { role_id: roleId });
      if (updated) {
        // Refresh members list
        selectHall(hallId);
      }
    } catch (error) {
      console.error("Failed to update member role:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Members</h1>
        <p className="text-[#73726e]">
          Manage members of your hall, their roles, and permissions.
        </p>
      </div>

      <div className="bg-white border border-[#dcd9d3] rounded-xl overflow-hidden">
        <MembersList
          members={members}
          roles={roles}
          onKick={handleKick}
          onUpdateRole={handleUpdateRole}
          currentUserId={user?.id}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
