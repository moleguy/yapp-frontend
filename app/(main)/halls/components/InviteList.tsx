"use client";

import React, { useState } from "react";
import { HallInvite } from "@/lib/api";
import { HiOutlineTrash, HiOutlineClipboardDocument, HiOutlineClock } from "react-icons/hi2";
import { useDialog } from "@/app/contexts/DialogContext";

interface InviteListProps {
  invites: HallInvite[];
  onRevoke: (inviteId: string) => Promise<void>;
  isOwner: boolean;
}

export default function InviteList({ invites, onRevoke, isOwner }: InviteListProps) {
  const { confirm, alert: showAlert } = useDialog();
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  const handleCopy = async (invite: HallInvite) => {
    const url = invite.url || `${window.location.origin}/invite/${invite.code}`;
    navigator.clipboard.writeText(url);
    await showAlert({ title: "Copied", message: "Invite link copied to clipboard!" });
  };

  const handleRevoke = async (inviteId: string) => {
    if (await confirm({ message: "Are you sure you want to revoke this invite?", destructive: true, confirmLabel: "Revoke" })) {
      setLoadingCode(inviteId);
      await onRevoke(inviteId);
      setLoadingCode(null);
    }
  };

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-list-muted">
        <p className="text-lg font-medium">No active invites</p>
        <p className="text-sm">Create an invite link to share your hall.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-default text-xs font-semibold text-list-muted uppercase tracking-wider">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Uses</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider">
          {invites.map((invite) => (
            <tr key={invite.id} className="hover:bg-list-hover transition-colors">
              <td className="px-4 py-4 font-mono text-sm font-medium text-primary">
                {invite.code}
              </td>
              <td className="px-4 py-4 text-sm text-heading">
                {invite.used_count}
                {invite.max_uses != null ? ` / ${invite.max_uses}` : " (no limit)"}
              </td>
              <td className="px-4 py-4 text-sm text-list-muted">
                <div className="flex items-center gap-1">
                  <HiOutlineClock size={14} />
                  {invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : "Never"}
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleCopy(invite)}
                    className="p-2 text-list-muted hover:text-primary hover:bg-primary-muted rounded-lg transition-colors"
                    title="Copy Link"
                  >
                    <HiOutlineClipboardDocument size={20} />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRevoke(invite.id)}
                      disabled={loadingCode === invite.id}
                      className="p-2 text-destructive hover:bg-destructive-muted rounded-lg transition-colors"
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
