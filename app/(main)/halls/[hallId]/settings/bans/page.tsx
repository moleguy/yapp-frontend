"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useHallBans,
  useSelectHall,
  useSelectedHall,
  useFetchBans,
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import BanList from "@/app/(main)/halls/components/BanList";
import { unbanUser } from "@/lib/api";

export default function HallBansSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const bans = useHallBans();
  const fetchBans = useFetchBans();
  const user = useUser();

  useEffect(() => {
    if (hallId) {
      void selectHall(hallId);
    }
  }, [hallId, selectHall]);

  useEffect(() => {
    if (hall?.id === hallId) {
      void fetchBans();
    }
  }, [hall?.id, hallId, fetchBans]);

  const handleUnban = async (banId: string) => {
    if (!hallId) return;
    try {
      const success = await unbanUser(hallId, banId);
      if (success) {
        void fetchBans();
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-default rounded-xl overflow-hidden">
        <BanList
          bans={bans}
          onUnban={handleUnban}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
