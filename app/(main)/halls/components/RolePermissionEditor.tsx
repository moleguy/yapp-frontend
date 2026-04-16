"use client";

import React, { useState, useEffect } from "react";
import { RolePermission, UpdateRolePermissionsReq } from "@/lib/api";

interface RolePermissionEditorProps {
  permissions: RolePermission | null;
  onSave: (updates: UpdateRolePermissionsReq) => Promise<void>;
  loading: boolean;
  isOwner: boolean;
}

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  admin: { label: "Administrator", description: "Provides all permissions and bypasses all restrictions." },
  manage_members: { label: "Manage Members", description: "Allows kicking members and changing nicknames." },
  manage_roles: { label: "Manage Roles", description: "Allows creating, editing, and deleting roles." },
  manage_bans: { label: "Manage Bans", description: "Allows banning and unbanning users." },
  create_invites: { label: "Create Invites", description: "Allows creating invite links for the hall." },
  create_floor: { label: "Manage Floors", description: "Allows creating, editing, and deleting floors." },
  create_room: { label: "Manage Rooms", description: "Allows creating, editing, and deleting rooms." },
  manage_messages: { label: "Manage Messages", description: "Allows deleting and pinning messages from others." },
  send_messages: { label: "Send Messages", description: "Allows sending text messages in rooms." },
  read_messages: { label: "Read Message History", description: "Allows reading past messages in rooms." },
  react_to_messages: { label: "Add Reactions", description: "Allows adding emoji reactions to messages." },
  attach_files: { label: "Attach Files", description: "Allows uploading files and media." },
};

export default function RolePermissionEditor({
  permissions,
  onSave,
  loading,
  isOwner,
}: RolePermissionEditorProps) {
  const [localPermissions, setLocalPermissions] = useState<Partial<RolePermission>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (permissions) {
      setLocalPermissions(permissions);
      setHasChanges(false);
    }
  }, [permissions]);

  const handleToggle = (key: string) => {
    if (!isOwner) return;

    setLocalPermissions((prev) => {
      const newVal = !prev[key as keyof RolePermission];
      const updated = { ...prev, [key]: newVal };
      setHasChanges(true);
      return updated;
    });
  };

  const handleSave = () => {
    const { role_id, created_at, updated_at, ...updates } = localPermissions as RolePermission;
    onSave(updates as UpdateRolePermissionsReq);
    setHasChanges(false);
  };

  if (!permissions) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a role to view and edit its permissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
        <h3 className="font-semibold text-[#1e1e1e]">Permissions</h3>
        {hasChanges && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocalPermissions(permissions);
                setHasChanges(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
          <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#1e1e1e]">{label}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!localPermissions[key as keyof RolePermission]}
                onChange={() => handleToggle(key)}
                disabled={!isOwner}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
