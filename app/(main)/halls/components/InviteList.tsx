"use client";

import React, { useState } from "react";
import { HallInvite } from "@/lib/api";
import { HiOutlineTrash, HiOutlineClipboardDocument, HiOutlineClock } from "react-icons/hi2";

interface InviteListProps {
  invites: HallInvite[];
  onRevoke: (code: string) => Promise<void>;
  isOwner: boolean;
}

export default function InviteList({ invites, onRevoke, isOwner }: InviteListProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    const url = `${window.location.origin}/invites/${code}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied to clipboard!");
  };

  const handleRevoke = async (code: string) => {
    if (window.confirm("Are you sure you want to revoke this invite?")) {
      setLoadingCode(code);
      await onRevoke(code);
      setLoadingCode(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="text-lg font-medium">No active invites</p>
        <p className="text-sm">Create an invite link to share your hall.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#dcd9d3] text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Uses</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dcd9d3]">
          {invites.map((invite) => (
            <tr key={invite.code} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 font-mono text-sm font-medium text-blue-600">
                {invite.code}
              </td>
              <td className="px-4 py-4 text-sm text-[#1e1e1e]">
                {invite.uses} {invite.max_uses ? `/ ${invite.max_uses}` : "uses"}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <HiOutlineClock size={14} />
                  {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : "Never"}
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleCopy(invite.code)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy Link"
                  >
                    <HiOutlineClipboardDocument size={20} />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRevoke(invite.code)}
                      disabled={loadingCode === invite.code}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Revoke Invite"
                    >
                      <HiOutlineTrash size={20} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
