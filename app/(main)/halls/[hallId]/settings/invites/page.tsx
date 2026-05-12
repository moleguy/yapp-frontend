"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  useHallInvites,
  useSelectHall,
  useSelectedHall
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import InviteList from "@/app/(main)/halls/components/InviteList";
import { createInvite, revokeInvite, InviteExpireAfter } from "@/lib/api";
import { HiOutlinePlus } from "react-icons/hi2";

export default function HallInvitesSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const invites = useHallInvites();
  const user = useUser();

  const [isCreating, setIsCreating] = useState(false);
  const [expireAfter, setExpireAfter] = useState<InviteExpireAfter>("7days");
  const [maxUses, setMaxUses] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

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
        selectHall(hallId); // Refresh list
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
        selectHall(hallId);
      }
    } catch (error) {
      console.error("Failed to revoke invite:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Invites</h1>
          <p className="text-[#73726e]">
            Manage active invite links for this hall.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiOutlinePlus size={20} />
            <span>Create Invite</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
          <h3 className="font-semibold text-blue-800">New Invite Link</h3>
          <div className="space-y-2">
            <label className="block text-sm text-blue-700">Expires after</label>
            <select
              value={expireAfter}
              onChange={(e) => setExpireAfter(e.target.value as InviteExpireAfter)}
              className="w-full max-w-xs px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            <label className="block text-sm text-blue-700">Max uses (leave empty for no limit)</label>
            <select
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Link"}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#dcd9d3] rounded-xl overflow-hidden">
        <InviteList
          invites={invites}
          onRevoke={handleRevoke}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
