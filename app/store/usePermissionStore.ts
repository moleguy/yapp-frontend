import { create } from "zustand";
import { RolePermission } from "@/lib/api";
import { useHallMembers, useHallRoles } from "./useHallStore";

type PermissionState = {
    // Cache of role permissions
    rolePermissions: Record<string, RolePermission>;

    // Actions
    setRolePermission: (roleId: string, permission: RolePermission) => void;
    setRolePermissions: (permissions: Record<string, RolePermission>) => void;
    clearPermissions: () => void;

    // Helpers
    getUserPermissionsInHall: (userId: string, hallId: string) => RolePermission | null;
    canUserAction: (
        userId: string,
        hallId: string,
        action: keyof Omit<RolePermission, "role_id" | "created_at" | "updated_at">,
    ) => boolean;
};

export const usePermissionStore = create<PermissionState>((set, get) => ({
    rolePermissions: {},

    // ===== Permission Management =====
    setRolePermission: (roleId: string, permission: RolePermission) => {
        set((state) => ({
            rolePermissions: {
                ...state.rolePermissions,
                [roleId]: permission,
            },
        }));
    },

    setRolePermissions: (permissions: Record<string, RolePermission>) => {
        set({ rolePermissions: permissions });
    },

    clearPermissions: () => {
        set({ rolePermissions: {} });
    },

    // ===== Helpers =====
    getUserPermissionsInHall: () => {
        // This is a basic implementation; in a real scenario you'd fetch from server
        // or derive from hall members and roles
        const permissions = get().rolePermissions;
        // For now, return null - will be populated by the component layer
        return Object.values(permissions)[0] || null;
    },

    canUserAction: (
        userId: string,
        hallId: string,
        action: keyof Omit<RolePermission, "role_id" | "created_at" | "updated_at">,
    ) => {
        const userPermissions = get().getUserPermissionsInHall(userId, hallId);
        if (!userPermissions) return false;

        const permission = userPermissions[action];
        return permission === true;
    },
}));

// ===== Permission Check Helpers =====
export const useCanCreateRoom = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "create_room"),
    );

export const useCanDeleteRoom = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "delete_room"),
    );

export const useCanSendMessages = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "send_messages"),
    );

export const useCanManageMessages = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "manage_messages"),
    );

export const useCanManageMembers = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "manage_members"),
    );

export const useCanManageRoles = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "manage_roles"),
    );

export const useCanCreateInvites = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "create_invites"),
    );

export const useCanManageBans = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "manage_bans"),
    );

export const useCanReadMessages = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "read_messages"),
    );

export const useCanReactToMessages = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "react_to_messages"),
    );

export const useCanAttachFiles = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "attach_files"),
    );

export const useCanMentionEveryone = (userId: string, hallId: string) =>
    usePermissionStore((state) =>
        state.canUserAction(userId, hallId, "mention_everyone"),
    );

// ===== All Permission Check =====
/**
 * Comprehensive permission checker
 * Derive permission from user's role in a hall
 */
export const useCheckPermissionInHall = (userId: string, hallId: string) => {
    const members = useHallMembers();
    const roles = useHallRoles();
    const rolePermissions = usePermissionStore((state) => state.rolePermissions);

    const userMember = members.find(
        (m) => m.user_id === userId && m.hall_id === hallId,
    );
    if (!userMember) return null;

    const userRole = roles.find((r) => r.id === userMember.role_id);
    if (!userRole) return null;

    return rolePermissions[userRole.id] || null;
};

// ===== Actions =====
export const useSetRolePermission = () =>
    usePermissionStore((state) => state.setRolePermission);

export const useSetRolePermissions = () =>
    usePermissionStore((state) => state.setRolePermissions);

export const useClearPermissions = () =>
    usePermissionStore((state) => state.clearPermissions);
