"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSelectedHall, useHallMembers, useHallRoles, useHallBans, useSelectHall, useFetchBans } from "@/app/store/useHallStore";
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineNoSymbol } from "react-icons/hi2";
import { LoadingState } from "@/app/(main)/components/FeedbackStates";

export default function HallSettingsOverview() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall(); // I need to verify if this is in useHallStore.ts or useUserStore.ts
  const members = useHallMembers();
  const roles = useHallRoles();
  const bans = useHallBans();
  const fetchBans = useFetchBans();

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

  if (!hall) {
    return <LoadingState message="Loading hall…" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-elevated p-6 rounded-xl border border-default flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-subtle text-primary rounded-full flex items-center justify-center mb-4">
            <HiOutlineUserGroup size={24} />
          </div>
          <span className="text-3xl font-bold text-heading">{members.length}</span>
          <span className="text-sm text-list-muted uppercase tracking-wider font-semibold">Members</span>
        </div>

        <div className="bg-surface-elevated p-6 rounded-xl border border-default flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <HiOutlineShieldCheck size={24} />
          </div>
          <span className="text-3xl font-bold text-heading">{roles.length}</span>
          <span className="text-sm text-list-muted uppercase tracking-wider font-semibold">Roles</span>
        </div>

        <div className="bg-surface-elevated p-6 rounded-xl border border-default flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-destructive-muted text-destructive rounded-full flex items-center justify-center mb-4">
            <HiOutlineNoSymbol size={24} />
          </div>
          <span className="text-3xl font-bold text-heading">{bans.length}</span>
          <span className="text-sm text-list-muted uppercase tracking-wider font-semibold">Bans</span>
        </div>
      </div>

      <div className="bg-primary-muted border border-primary-soft p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-primary-emphasis mb-2">Hall Information</h3>
        <div className="space-y-2">
          <p className="text-primary-emphasis">
            <span className="font-medium">Name:</span> {hall.name}
          </p>
          <p className="text-primary-emphasis">
            <span className="font-medium">Description:</span> {hall.description || "No description set."}
          </p>
          <p className="text-primary-emphasis">
            <span className="font-medium">Owner ID:</span> {hall.owner_id}
          </p>
        </div>
      </div>
    </div>
  );
}
