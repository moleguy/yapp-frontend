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
import { createInvite, revokeInvite } from "@/lib/api";
import { HiOutlinePlus } from "react-icons/hi2";

export default function HallInvitesSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const invites = useHallInvites();
  const user = useUser();

  const [isCreating, setIsCreating] = useState(false);
  const [maxUses, setMaxUses] = useState<number>(0);
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
      const newInvite = await createInvite(hallId, {
        max_uses: maxUses > 0 ? maxUses : undefined
      });
      if (newInvite) {
        setIsCreating(false);
        setMaxUses(0);
        selectHall(hallId); // Refresh list
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (code: string) => {
    if (!hallId) return;
    try {
      const success = await revokeInvite(hallId, code);
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
            <label className="block text-sm text-blue-700">Max Uses (0 for unlimited)</label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
              className="w-full max-w-xs px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
