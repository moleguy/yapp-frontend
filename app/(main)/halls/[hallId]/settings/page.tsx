"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSelectedHall, useHallMembers, useHallRoles, useHallBans, useSelectHall } from "@/app/store/useHallStore";
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineNoSymbol } from "react-icons/hi2";

export default function HallSettingsOverview() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall(); // I need to verify if this is in useHallStore.ts or useUserStore.ts
  const members = useHallMembers();
  const roles = useHallRoles();
  const bans = useHallBans();

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  if (!hall) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Overview</h1>
        <p className="text-[#73726e]">
          Manage your hall's general settings, members, and permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#dcd9d3] flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <HiOutlineUserGroup size={24} />
          </div>
          <span className="text-3xl font-bold text-[#1e1e1e]">{members.length}</span>
          <span className="text-sm text-[#73726e] uppercase tracking-wider font-semibold">Members</span>
        </div>

        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#dcd9d3] flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <HiOutlineShieldCheck size={24} />
          </div>
          <span className="text-3xl font-bold text-[#1e1e1e]">{roles.length}</span>
          <span className="text-sm text-[#73726e] uppercase tracking-wider font-semibold">Roles</span>
        </div>

        <div className="bg-[#f9f9f9] p-6 rounded-xl border border-[#dcd9d3] flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <HiOutlineNoSymbol size={24} />
          </div>
          <span className="text-3xl font-bold text-[#1e1e1e]">{bans.length}</span>
          <span className="text-sm text-[#73726e] uppercase tracking-wider font-semibold">Bans</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Hall Information</h3>
        <div className="space-y-2">
          <p className="text-blue-700">
            <span className="font-medium">Name:</span> {hall.name}
          </p>
          <p className="text-blue-700">
            <span className="font-medium">Description:</span> {hall.description || "No description set."}
          </p>
          <p className="text-blue-700">
            <span className="font-medium">Owner ID:</span> {hall.owner_id}
          </p>
        </div>
      </div>
    </div>
  );
}
