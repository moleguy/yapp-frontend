"use client";

import React, { useState } from "react";
import { HallMember, Role } from "@/lib/api";
import { HiOutlineUserMinus } from "react-icons/hi2";

interface MembersListProps {
  members: HallMember[];
  roles: Role[];
  onKick: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, roleId: string) => Promise<void>;
  currentUserId?: string;
  isOwner: boolean;
}

export default function MembersList({
  members,
  roles,
  onKick,
  onUpdateRole,
  currentUserId,
  isOwner,
}: MembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getRoleName = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.name || "Unknown Role";
  };

  const getRoleColor = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.color ?? "#73726e";
  };

  const handleKick = async (memberId: string) => {
    if (window.confirm("Are you sure you want to kick this member?")) {
      setLoadingId(memberId);
      await onKick(memberId);
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#dcd9d3] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dcd9d3]">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {/* In a real app, we'd fetch the user's avatar */}
                    <span className="text-gray-500 font-medium">
                      {member.nickname?.[0].toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-[#1e1e1e]">
                      {member.nickname || "Unknown User"}
                    </div>
                    <div className="text-xs text-gray-500">ID: {member.user_id.substring(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRoleColor(member.role_id) }}
                  ></span>
                  <span className="text-sm text-[#1e1e1e] font-medium">
                    {getRoleName(member.role_id)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {new Date(member.joined_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-right">
                {isOwner && member.user_id !== currentUserId && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleKick(member.id)}
                      disabled={loadingId === member.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Kick Member"
                    >
                      <HiOutlineUserMinus size={20} />
                    </button>
                    {/* Role update would typically be a dropdown */}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
