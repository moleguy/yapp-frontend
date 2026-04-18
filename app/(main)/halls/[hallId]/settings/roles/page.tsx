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
  RolePermission,
  getRolePermissions,
  updateRolePermissions,
  createRole,
  deleteRole,
  UpdateRolePermissionsReq
} from "@/lib/api";
import { HiOutlinePlus } from "react-icons/hi2";

export default function HallRolesSettings() {
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();
  const roles = useHallRoles();
  const user = useUser();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermission | null>(null);
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
      if (updated) {
        setPermissions(updated);
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
    if (window.confirm("Are you sure you want to delete this role?")) {
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
    // This could open a name/color editor, for now just simple implementation
    console.log("Update role:", role);
  };

  if (!hall) return null;

  const isOwner = hall.owner_id === user?.id;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1e1e] mb-2">Roles</h1>
          <p className="text-[#73726e]">
            Create and manage roles and their associated permissions.
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiOutlinePlus size={20} />
            <span>Create Role</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Roles List */}
        <div className="w-1/3 border border-[#dcd9d3] rounded-xl bg-white overflow-y-auto p-4">
          {isCreating && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Role name"
                className="w-full px-3 py-1.5 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRole}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="flex-1 border border-[#dcd9d3] rounded-xl bg-white overflow-y-auto p-6">
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
