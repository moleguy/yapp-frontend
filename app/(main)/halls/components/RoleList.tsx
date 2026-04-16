"use client";

import React from "react";
import { Role } from "@/lib/api";
import { HiOutlineShieldCheck, HiOutlineTrash, HiOutlinePencil } from "react-icons/hi2";

interface RoleListProps {
  roles: Role[];
  selectedRoleId: string | null;
  onSelectRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  onUpdateRole: (role: Role) => void;
  isOwner: boolean;
}

export default function RoleList({
  roles,
  selectedRoleId,
  onSelectRole,
  onDeleteRole,
  onUpdateRole,
  isOwner,
}: RoleListProps) {
  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div
          key={role.id}
          onClick={() => onSelectRole(role)}
          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            selectedRoleId === role.id
              ? "bg-[#efefef] text-[#222831]"
              : "hover:bg-gray-50 text-[#73726e] hover:text-[#222831]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-gray-200"
              style={{ backgroundColor: role.color }}
            />
            <span className="font-medium">{role.name}</span>
            {role.is_admin && (
              <HiOutlineShieldCheck className="text-blue-500" title="Administrator" />
            )}
            {role.is_default && (
              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                Default
              </span>
            )}
          </div>

          {isOwner && !role.is_default && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRole(role.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
