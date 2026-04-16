"use client";

import React, { useState } from "react";
import { HallBan } from "@/lib/api";
import { HiOutlineUserMinus, HiOutlineShieldExclamation } from "react-icons/hi2";

interface BanListProps {
  bans: HallBan[];
  onUnban: (userId: string) => Promise<void>;
  isOwner: boolean;
}

export default function BanList({ bans, onUnban, isOwner }: BanListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUnban = async (userId: string) => {
    if (window.confirm("Are you sure you want to unban this user?")) {
      setLoadingId(userId);
      await onUnban(userId);
      setLoadingId(null);
    }
  };

  if (bans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <HiOutlineShieldExclamation size={32} className="text-gray-400" />
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
          <tr className="border-b border-[#dcd9d3] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Banned At</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dcd9d3]">
          {bans.map((ban) => (
            <tr key={ban.user_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div className="font-medium text-[#1e1e1e]">
                  ID: {ban.user_id.substring(0, 8)}...
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-[#73726e]">
                {ban.reason || "No reason provided."}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {new Date(ban.banned_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-right">
                {isOwner && (
                  <button
                    onClick={() => handleUnban(ban.user_id)}
                    disabled={loadingId === ban.user_id}
                    className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {loadingId === ban.user_id ? "Unbanning..." : "Unban"}
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
