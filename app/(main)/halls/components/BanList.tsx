"use client";

import React, { useState } from "react";
import { HallBan } from "@/lib/api";
import { HiOutlineUserMinus, HiOutlineShieldExclamation } from "react-icons/hi2";
import { useDialog } from "@/app/contexts/DialogContext";

interface BanListProps {
  bans: HallBan[];
  onUnban: (banId: string) => Promise<void>;
  isOwner: boolean;
}

export default function BanList({ bans, onUnban, isOwner }: BanListProps) {
  const { confirm } = useDialog();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUnban = async (banId: string) => {
    if (await confirm({ message: "Are you sure you want to unban this user?", confirmLabel: "Unban" })) {
      setLoadingId(banId);
      await onUnban(banId);
      setLoadingId(null);
    }
  };

  if (bans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-list-muted">
        <div className="w-16 h-16 bg-surface-inset rounded-full flex items-center justify-center mb-4">
          <HiOutlineShieldExclamation size={32} className="text-faint" />
        </div>
        <p className="text-lg font-medium">No bans yet</p>
        <p className="text-sm">Banned users will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-default text-xs font-semibold text-list-muted uppercase tracking-wider">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Banned At</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {bans.map((ban) => (
            <tr key={ban.id} className="hover:bg-list-hover transition-colors">
              <td className="px-4 py-4">
                <div className="font-medium text-heading">
                  {ban.username}
                </div>
                <div className="text-xs text-list-muted">User ID: {ban.user_id.substring(0, 8)}…</div>
              </td>
              <td className="px-4 py-4 text-sm text-list-muted">
                {ban.reason || "No reason provided."}
              </td>
              <td className="px-4 py-4 text-sm text-list-muted">
                {new Date(ban.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-right">
                {isOwner && (
                  <button
                    onClick={() => handleUnban(ban.id)}
                    disabled={loadingId === ban.id}
                    className="px-3 py-1 text-sm border border-destructive text-destructive rounded-lg hover:bg-destructive-muted transition-colors disabled:opacity-50"
                  >
                    {loadingId === ban.id ? "Unbanning..." : "Unban"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
