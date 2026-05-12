import { create } from "zustand";
import { flattenRolePermissions, RolePermissionsData } from "@/lib/api";
import { useHallMembers, useHallRoles, useHallStore } from "./useHallStore";

/** permission key -> enabled (from GET role permissions / categories) */
export type PermissionFlags = Record<string, boolean>;

type PermissionState = {
  rolePermissionFlags: Record<string, PermissionFlags>;

  setRolePermissionData: (roleId: string, data: RolePermissionsData) => void;
  setRolePermissionFlags: (roleId: string, flags: PermissionFlags) => void;
  setRolePermissionsMap: (map: Record<string, PermissionFlags>) => void;
  clearPermissions: () => void;

  canUserAction: (userId: string, hallId: string, permissionKey: string) => boolean;
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
  rolePermissionFlags: {},

  setRolePermissionData: (roleId: string, data: RolePermissionsData) => {
    const flags = flattenRolePermissions(data);
    set((state) => ({
      rolePermissionFlags: { ...state.rolePermissionFlags, [roleId]: flags },
    }));
  },

  setRolePermissionFlags: (roleId: string, flags: PermissionFlags) => {
    set((state) => ({
      rolePermissionFlags: { ...state.rolePermissionFlags, [roleId]: flags },
    }));
  },

  setRolePermissionsMap: (map: Record<string, PermissionFlags>) => {
    set({ rolePermissionFlags: map });
  },

  clearPermissions: () => {
    set({ rolePermissionFlags: {} });
  },

  canUserAction: (userId: string, hallId: string, permissionKey: string) => {
    const members = useHallStore.getState().members;
    const member = members.find((m) => m.user_id === userId && m.hall_id === hallId);
    if (!member) return false;

    const userRole = useHallStore.getState().roles.find((r) => r.id === member.role_id);
    if (userRole?.is_admin) return true;

    const flags = get().rolePermissionFlags[member.role_id];
    if (!flags) return false;
    return flags[permissionKey] === true;
  },
}));

export const useCanCreateRoom = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "manage_channels"));

export const useCanDeleteRoom = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "manage_channels"));

export const useCanSendMessages = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_send_messages"));

export const useCanManageMessages = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_manage_messages"));

export const useCanManageMembers = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "kick_members"));

export const useCanManageRoles = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "manage_roles"));

export const useCanCreateInvites = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "manage_invites"));

export const useCanManageBans = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "ban_members"));

export const useCanReadMessages = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_read_history"));

export const useCanReactToMessages = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_send_messages"));

export const useCanAttachFiles = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_attach_files"));

export const useCanMentionEveryone = (userId: string, hallId: string) =>
  usePermissionStore((state) => state.canUserAction(userId, hallId, "text_mention_roles"));

export const useCheckPermissionInHall = (userId: string, hallId: string) => {
  const members = useHallMembers();
  const roles = useHallRoles();
  const rolePermissionFlags = usePermissionStore((state) => state.rolePermissionFlags);

  const userMember = members.find((m) => m.user_id === userId && m.hall_id === hallId);
  if (!userMember) return null;

  const userRole = roles.find((r) => r.id === userMember.role_id);
  if (!userRole) return null;

  if (userRole.is_admin) {
    return { is_admin: true as const, flags: rolePermissionFlags[userRole.id] || {} };
  }

  return rolePermissionFlags[userRole.id] || null;
};

export const useSetRolePermissionData = () =>
  usePermissionStore((state) => state.setRolePermissionData);

export const useSetRolePermissionFlags = () =>
  usePermissionStore((state) => state.setRolePermissionFlags);

export const useSetRolePermissionsMap = () =>
  usePermissionStore((state) => state.setRolePermissionsMap);

export const useClearPermissions = () =>
  usePermissionStore((state) => state.clearPermissions);
