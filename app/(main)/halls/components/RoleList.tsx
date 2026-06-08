"use client";

import React from "react";
import { listItemClasses } from "@/lib/listItemClasses";
import { Role } from "@/lib/api";
import { isCreatorRole } from "@/lib/roleUtils";
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
          className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${listItemClasses(selectedRoleId === role.id)}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-subtle"
              style={{ backgroundColor: role.color ?? "#99aab5" }}
            />
            <span className="font-medium">{role.name}</span>
            {role.is_admin && (
              <HiOutlineShieldCheck className="text-primary" title="Administrator" />
            )}
            {role.is_default && (
              <span className="text-[10px] bg-surface-control text-secondary px-1.5 py-0.5 rounded uppercase font-bold">
                Default
              </span>
            )}
          </div>

          {isOwner && !role.is_default && !isCreatorRole(role) && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateRole(role);
                }}
                className="p-1.5 text-list-muted rounded-md hover:bg-list-hover hover:text-list-emphasis"
                title="Rename role"
                aria-label={`Rename ${role.name}`}
              >
                <HiOutlinePencil size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRole(role.id);
                }}
                className="p-1.5 text-destructive rounded-md hover:bg-destructive-muted"
                title="Delete role"
                aria-label={`Delete ${role.name}`}
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
