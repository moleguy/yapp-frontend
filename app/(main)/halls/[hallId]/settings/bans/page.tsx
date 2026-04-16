"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useHallBans,
  useSelectHall,
  useSelectedHall
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import BanList from "../../components/BanList";
import { unbanUser } from "@/lib/api";

export default function HallBansSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const bans = useHallBans();
  const user = useUser();

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  const handleUnban = async (userId: string) => {
    if (!hallId) return;
    try {
      const success = await unbanUser(hallId, userId);
      if (success) {
        // Refresh bans list
        selectHall(hallId);
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Bans</h1>
        <p className="text-[#73726e]">
          Manage banned users in this hall.
        </p>
      </div>

      <div className="bg-white border border-[#dcd9d3] rounded-xl overflow-hidden">
        <BanList
          bans={bans}
          onUnban={handleUnban}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
