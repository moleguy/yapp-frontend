"use client";

import React, { useState } from "react";
import { HallMember, Role } from "@/lib/api";
import { HiOutlineUserMinus } from "react-icons/hi2";
import { useDialog } from "@/app/contexts/DialogContext";
import { usePresenceByUserId } from "@/app/store/usePresenceStore";
import { presenceBgClass, resolvePresenceStatus } from "@/lib/presenceUtils";
import { roleDotColor, roleNameClassName } from "@/lib/roleUtils";

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
  const { confirm, prompt } = useDialog();
  const presenceByUserId = usePresenceByUserId();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name || "Unknown Role";

  const getRole = (roleId: string) => roles.find((r) => r.id === roleId);

  const getRoleColor = (roleId: string) => roleDotColor(getRole(roleId));

  const displayName = (member: HallMember) =>
    member.nickname ||
    member.user?.display_name ||
    member.user?.username ||
    `User ${member.user_id.slice(0, 8)}`;

  const handleKick = async (memberId: string) => {
    if (!(await confirm({ message: "Are you sure you want to kick this member?", destructive: true, confirmLabel: "Kick" }))) return;
    setLoadingId(memberId);
    await onKick(memberId);
    setLoadingId(null);
  };

  const handleBan = async (member: HallMember) => {
    if (!onBan) return;
    if (!(await confirm({ message: `Ban ${displayName(member)} from this hall?`, destructive: true, confirmLabel: "Ban" }))) return;
    setLoadingId(member.id);
    await onBan(member.user_id);
    setLoadingId(null);
  };

  const handleNickname = async (member: HallMember) => {
    if (!onUpdateNickname) return;
    const nickname = await prompt({
      title: "Set nickname",
      message: "Leave empty to clear",
      defaultValue: member.nickname || "",
    });
    if (nickname === null) return;
    setLoadingId(member.id);
    await onUpdateNickname(member.id, nickname.trim() || null);
    setLoadingId(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-default text-xs font-semibold text-list-muted uppercase tracking-wider">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-list-hover transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-surface-control flex items-center justify-center overflow-hidden">
                      <span className="text-list-muted font-medium">
                        {displayName(member).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-0 right-0 w-3 h-3 border-2 border-surface-card rounded-full ${presenceBgClass(
                        resolvePresenceStatus(member.user_id, presenceByUserId, member.presence)
                      )}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-heading">{displayName(member)}</div>
                    <div className="text-xs text-list-muted">
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
                    className="text-sm border border-default rounded px-2 py-1"
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
                    <span className={roleNameClassName(getRole(member.role_id))}>
                      {getRoleName(member.role_id)}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-sm text-list-muted">
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
                        className="px-2 py-1 text-xs text-primary hover:bg-primary-muted rounded"
                      >
                        Nickname
                      </button>
                    )}
                    {onBan && (
                      <button
                        type="button"
                        onClick={() => handleBan(member)}
                        disabled={loadingId === member.id}
                        className="px-2 py-1 text-xs text-destructive hover:bg-destructive-muted rounded"
                      >
                        Ban
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleKick(member.id)}
                      disabled={loadingId === member.id}
                      className="p-2 text-destructive hover:bg-destructive-muted rounded-lg transition-colors"
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
