"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useHallRoles,
  useSelectHall,
  useSelectedHall
} from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import RoleList from "@/app/(main)/halls/components/RoleList";
import RolePermissionEditor from "@/app/(main)/halls/components/RolePermissionEditor";
import {
  Role,
  RolePermissionsData,
  getRolePermissions,
  updateRolePermissions,
  createRole,
  updateRole,
  deleteRole,
  UpdateRolePermissionsReq,
} from "@/lib/api";
import { HiOutlinePlus } from "react-icons/hi2";
import { useDialog } from "@/app/contexts/DialogContext";
import { isCreatorRole } from "@/lib/roleUtils";

export default function HallRolesSettings() {
  const { confirm, prompt } = useDialog();
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const roles = useHallRoles();
  const user = useUser();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    if (hallId) {
      selectHall(hallId);
    }
  }, [hallId, selectHall]);

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole.id);
    } else {
      setPermissions(null);
    }
  }, [selectedRole]);

  const fetchPermissions = async (roleId: string) => {
    if (!hallId) return;
    setLoading(true);
    try {
      const data = await getRolePermissions(hallId, roleId);
      setPermissions(data);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async (updates: UpdateRolePermissionsReq) => {
    if (!hallId || !selectedRole) return;
    setLoading(true);
    try {
      const updated = await updateRolePermissions(hallId, selectedRole.id, updates);
      if (updated && permissions) {
        setPermissions({
          ...permissions,
          categories: updated.categories,
        });
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!hallId || !newRoleName.trim()) return;
    try {
      const newRole = await createRole(hallId, { name: newRoleName, color: "#99aab5" });
      if (newRole) {
        setNewRoleName("");
        setIsCreating(false);
        selectHall(hallId); // Refresh roles list
      }
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!hallId) return;
    const role = roles.find((r) => r.id === roleId);
    if (isCreatorRole(role)) return;
    if (await confirm({ message: "Are you sure you want to delete this role?", destructive: true })) {
      try {
        const success = await deleteRole(hallId, roleId);
        if (success) {
          if (selectedRole?.id === roleId) setSelectedRole(null);
          selectHall(hallId);
        }
      } catch (error) {
        console.error("Failed to delete role:", error);
      }
    }
  };

  const handleUpdateRole = async (role: Role) => {
    if (!hallId || isCreatorRole(role)) return;
    const name = await prompt({ title: "Rename role", defaultValue: role.name });
    if (!name?.trim() || name === role.name) return;
    try {
      const updated = await updateRole(hallId, role.id, { name: name.trim() });
      if (updated) selectHall(hallId);
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-end">
        {isOwner && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            <HiOutlinePlus size={20} />
            <span>Create Role</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Roles List */}
        <div className="w-1/3 border border-default rounded-xl bg-surface-card overflow-y-auto p-4">
          {isCreating && (
            <div className="mb-4 p-3 bg-primary-muted border border-primary-subtle rounded-lg space-y-3">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Role name"
                className="w-full px-3 py-1.5 text-sm border border-primary-soft rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-list-muted hover:text-strong"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
                >
                  Create
                </button>
              </div>
            </div>
          )}
          <RoleList
            roles={roles}
            selectedRoleId={selectedRole?.id || null}
            onSelectRole={setSelectedRole}
            onDeleteRole={handleDeleteRole}
            onUpdateRole={handleUpdateRole}
            isOwner={isOwner}
          />
        </div>

        {/* Permission Editor */}
        <div className="flex-1 border border-default rounded-xl bg-surface-card overflow-y-auto p-6">
          <RolePermissionEditor
            permissions={permissions}
            onSave={handleSavePermissions}
            loading={loading}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  );
}
