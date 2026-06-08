"use client";

import React, { useEffect, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { HiOutlineClipboardDocument } from "react-icons/hi2";
import {
  createInvite,
  HallInvite,
  InviteExpireAfter,
} from "@/lib/api";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useCanCreateInvites } from "@/app/store/usePermissionStore";
import Modal from "./Modal";

export interface InvitePeoplePopupProps {
  isOpen: boolean;
  onClose: () => void;
  hall: { id: string; name: string; owner_id?: string } | null;
  currentUserId?: string;
}

// TODO: Add back after link-based invite feature is available in the backend
// function inviteUrl(invite: HallInvite): string {
//   return invite.url || `${window.location.origin}/invite/${invite.code}`;
// }

export default function InvitePeoplePopup({
  isOpen,
  onClose,
  hall,
  currentUserId,
}: InvitePeoplePopupProps) {
  const [expireAfter, setExpireAfter] = useState<InviteExpireAfter>("7days");
  const [maxUses, setMaxUses] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<HallInvite | null>(null);
  const [copied, setCopied] = useState<"code" | null>(null);

  const canCreateInvites = useCanCreateInvites(currentUserId ?? "", hall?.id ?? "");
  const isOwner = hall?.owner_id != null && hall.owner_id === currentUserId;
  const allowed = isOwner || canCreateInvites;

  useEffect(() => {
    if (!isOpen) return;

    setExpireAfter("7days");
    setMaxUses("");
    setLoading(false);
    setError(null);
    setCreatedInvite(null);
    setCopied(null);
  }, [isOpen, hall?.id]);

  if (!hall) return null;

  const handleGenerate = async () => {
    if (!allowed) return;
    setLoading(true);
    setError(null);

    try {
      const validUses = [1, 5, 10, 25, 50, 100];
      const parsed = parseInt(maxUses, 10);
      const invite = await createInvite(hall.id, {
        expire_after: expireAfter,
        max_uses: validUses.includes(parsed) ? parsed : null,
      });

      if (!invite) {
        setError("Could not create invite. You may not have permission.");
        return;
      }

      setCreatedInvite(invite);
    } catch {
      setError("Failed to create invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyWithFeedback = (text: string, kind: "code") => {
    if (!copyTextToClipboard(text)) return;
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  // TODO: Add back after link-based invite feature is available in the backend
  // const handleCopyLink = () => {
  //   if (!createdInvite) return;
  //   copyWithFeedback(inviteUrl(createdInvite), "link");
  // };

  const handleCopyCode = () => {
    if (!createdInvite) return;
    copyWithFeedback(createdInvite.code, "code");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledby="invite-people-title"
      panelClassName="bg-surface-card rounded-xl border border-default shadow-lg w-full max-w-md p-6"
    >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="invite-people-title" className="text-xl font-medium text-list-emphasis tracking-wide">
              Invite People
            </h2>
            <p className="text-sm text-list-muted mt-1">
              Share an invite code to invite others to <span className="font-medium">{hall.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-list-muted hover:bg-list-hover hover:text-list-emphasis transition-colors"
            aria-label="Close"
          >
            <IoIosClose className="w-7 h-7" />
          </button>
        </div>

        {!allowed ? (
          <p className="text-sm text-list-muted py-4">
            You don&apos;t have permission to create invites for this hall.
          </p>
        ) : createdInvite ? (
          <div className="space-y-4">
            <p className="text-sm text-list-muted">
              Invite code created. Copy and share it with anyone you want to join.
            </p>
            <div className="space-y-3">
              {/* TODO: Add back the invite link input and copy button after link-based invite feature is available in the backend */}
              {/* <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl(createdInvite)}
                  className="flex-1 py-2 px-3 border border-default rounded-lg text-sm text-list-emphasis bg-surface-elevated focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-default text-list-emphasis hover:bg-surface-muted transition-colors text-sm whitespace-nowrap"
                >
                  <HiOutlineClipboardDocument size={18} />
                  {copied === "link" ? "Copied!" : "Copy"}
                </button>
              </div> */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInvite.code}
                  className="flex-1 py-2 px-3 border border-default rounded-lg text-sm text-list-emphasis bg-surface-elevated font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-default text-list-emphasis hover:bg-surface-muted transition-colors text-sm whitespace-nowrap"
                >
                  <HiOutlineClipboardDocument size={18} />
                  {copied === "code" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedInvite(null);
                  setCopied(null);
                }}
                className="px-4 py-2 rounded-lg border border-default text-list-emphasis hover:bg-surface-muted transition-colors"
              >
                Create another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-list-emphasis">Expires after</label>
              <select
                value={expireAfter}
                onChange={(e) => setExpireAfter(e.target.value as InviteExpireAfter)}
                className="w-full px-3 py-2 border border-default rounded-lg text-list-emphasis focus:outline-none focus:border-primary bg-surface-card"
              >
                <option value="30min">30 minutes</option>
                <option value="1hr">1 hour</option>
                <option value="6hr">6 hours</option>
                <option value="12hr">12 hours</option>
                <option value="1day">1 day</option>
                <option value="7days">7 days</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-list-emphasis">
                Max uses
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-lg text-list-emphasis focus:outline-none focus:border-primary bg-surface-card"
              >
                <option value="">No limit</option>
                <option value="1">1</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-default text-list-emphasis hover:bg-surface-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Invite"}
              </button>
            </div>
          </div>
        )}
    </Modal>
  );
}
