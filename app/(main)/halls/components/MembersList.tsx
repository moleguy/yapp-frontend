"use client";

import React, { useState } from "react";
import { HallMember, Role } from "@/lib/api";
import { HiOutlineUserMinus } from "react-icons/hi2";

interface MembersListProps {
  members: HallMember[];
  roles: Role[];
  onKick: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, roleId: string) => Promise<void>;
  onUpdateNickname?: (memberId: string, nickname: string | null) => Promise<void>;
  onBan?: (userId: string) => Promise<void>;
  currentUserId?: string;
  isOwner: boolean;
}

export default function MembersList({
  members,
  roles,
  onKick,
  onUpdateRole,
  onUpdateNickname,
  onBan,
  currentUserId,
  isOwner,
}: MembersListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name || "Unknown Role";

  const getRoleColor = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.color ?? "#73726e";

  const displayName = (member: HallMember) =>
    member.nickname ||
    member.user?.display_name ||
    member.user?.username ||
    "Unknown User";

  const handleKick = async (memberId: string) => {
    if (!window.confirm("Are you sure you want to kick this member?")) return;
    setLoadingId(memberId);
    await onKick(memberId);
    setLoadingId(null);
  };

  const handleBan = async (member: HallMember) => {
    if (!onBan) return;
    if (!window.confirm(`Ban ${displayName(member)} from this hall?`)) return;
    setLoadingId(member.id);
    await onBan(member.user_id);
    setLoadingId(null);
  };

  const handleNickname = async (member: HallMember) => {
    if (!onUpdateNickname) return;
    const nickname = window.prompt("Set nickname (leave empty to clear)", member.nickname || "");
    if (nickname === null) return;
    setLoadingId(member.id);
    await onUpdateNickname(member.id, nickname.trim() || null);
    setLoadingId(null);
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
                    <span className="text-gray-500 font-medium">
                      {displayName(member).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-[#1e1e1e]">{displayName(member)}</div>
                    <div className="text-xs text-gray-500">
                      {member.user?.username ? `@${member.user.username}` : member.user_id.substring(0, 8)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                {isOwner && member.user_id !== currentUserId ? (
                  <select
                    value={member.role_id}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="text-sm border border-[#dcd9d3] rounded px-2 py-1"
                    disabled={loadingId === member.id}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getRoleColor(member.role_id) }}
                    />
                    <span className="text-sm text-[#1e1e1e] font-medium">
                      {getRoleName(member.role_id)}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {new Date(member.joined_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-right">
                {isOwner && member.user_id !== currentUserId && (
                  <div className="flex justify-end gap-2">
                    {onUpdateNickname && (
                      <button
                        type="button"
                        onClick={() => handleNickname(member)}
                        disabled={loadingId === member.id}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Nickname
                      </button>
                    )}
                    {onBan && (
                      <button
                        type="button"
                        onClick={() => handleBan(member)}
                        disabled={loadingId === member.id}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleKick(member.id)}
                      disabled={loadingId === member.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Kick Member"
                    >
                      <HiOutlineUserMinus size={20} />
                    </button>
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
