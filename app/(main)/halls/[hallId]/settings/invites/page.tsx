"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useHallInvites,
  useSelectHall,
  useSelectedHall,
  useFetchInvites,
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import { useDialog } from "@/app/contexts/DialogContext";
import InviteList from "@/app/(main)/halls/components/InviteList";
import { createInvite, revokeInvite, InviteExpireAfter } from "@/lib/api";
import { HiOutlinePlus } from "react-icons/hi2";

export default function HallInvitesSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const invites = useHallInvites();
  const fetchInvites = useFetchInvites();
  const user = useUser();
  const { confirm, alert: showAlert } = useDialog();

  const [isCreating, setIsCreating] = useState(false);
  const [expireAfter, setExpireAfter] = useState<InviteExpireAfter>("7days");
  const [maxUses, setMaxUses] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (hallId) {
      void selectHall(hallId);
    }
  }, [hallId, selectHall]);

  useEffect(() => {
    if (hall?.id === hallId) {
      void fetchInvites();
    }
  }, [hall?.id, hallId, fetchInvites]);

  const handleCreateInvite = async () => {
    if (!hallId) return;
    setLoading(true);
    try {
      const validUses = [1, 5, 10, 25, 50, 100];
      const parsed = parseInt(maxUses, 10);
      const newInvite = await createInvite(hallId, {
        expire_after: expireAfter,
        max_uses: validUses.includes(parsed) ? parsed : null,
      });
      if (newInvite) {
        setIsCreating(false);
        setMaxUses("");
        void fetchInvites();
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!hallId) return;
    try {
      const success = await revokeInvite(hallId, inviteId);
      if (success) {
        void fetchInvites();
      }
    } catch (error) {
      console.error("Failed to revoke invite:", error);
    }
  };

  const handleRevokeAll = async () => {
    if (!hallId || invites.length === 0) return;

    const count = invites.length;
    const confirmed = await confirm({
      title: "Revoke all invites",
      message: `Revoke all ${count} active invite link${count === 1 ? "" : "s"}? They will stop working immediately.`,
      destructive: true,
      confirmLabel: "Revoke All",
    });
    if (!confirmed) return;

    setRevokingAll(true);
    try {
      const results = await Promise.all(
        invites.map((invite) => revokeInvite(hallId, invite.id)),
      );
      const failed = results.filter((ok) => !ok).length;
      await fetchInvites();
      if (failed > 0) {
        await showAlert({
          title: "Some invites could not be revoked",
          message: `${failed} of ${count} invite${count === 1 ? "" : "s"} failed to revoke. The list has been refreshed.`,
        });
      }
    } catch (error) {
      console.error("Failed to revoke all invites:", error);
      await showAlert({
        title: "Revoke failed",
        message: "Could not revoke all invites. Please try again.",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        {isOwner && invites.length > 0 && (
          <button
            type="button"
            onClick={handleRevokeAll}
            disabled={revokingAll || loading}
            className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive-muted transition-colors disabled:opacity-50"
          >
            {revokingAll ? "Revoking…" : "Revoke All"}
          </button>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            disabled={revokingAll}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <HiOutlinePlus size={20} />
            <span>Create Invite</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="p-6 bg-primary-muted border border-primary-subtle rounded-xl space-y-4">
          <h3 className="font-semibold text-primary-emphasis">New Invite Link</h3>
          <div className="space-y-2">
            <label className="block text-sm text-primary-emphasis">Expires after</label>
            <select
              value={expireAfter}
              onChange={(e) => setExpireAfter(e.target.value as InviteExpireAfter)}
              className="w-full max-w-xs px-3 py-2 border border-primary-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-card"
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
            <label className="block text-sm text-primary-emphasis">Max uses (leave empty for no limit)</label>
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-primary-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-surface-card"
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
          <div className="flex gap-3">
            <button
              onClick={handleCreateInvite}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Link"}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-secondary hover:text-heading"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface-card border border-default rounded-xl overflow-hidden">
        <InviteList
          invites={invites}
          onRevoke={handleRevoke}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
