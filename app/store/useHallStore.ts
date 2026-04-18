import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    Hall,
    Role,
    HallMember,
    HallBan,
    HallInvite,
    getUserHalls,
    getHall,
    getHallMembers,
    getRoles,
    getHallBans,
    getHallInvites,
} from "@/lib/api";

type HallState = {
    // Data
    halls: Hall[];
    selectedHallId: string | null;
    selectedHall: Hall | null;
    members: HallMember[];
    roles: Role[];
    bans: HallBan[];
    invites: HallInvite[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchHalls: () => Promise<void>;
    selectHall: (hallId: string) => Promise<void>;
    setSelectedHall: (hall: Hall | null) => void;
    addHall: (hall: Hall) => void;
    removeHall: (hallId: string) => void;
    updateHall: (hallId: string, updates: Partial<Hall>) => void;
    clearHalls: () => void;

    // Hall settings
    fetchMembers: () => Promise<void>;
    fetchRoles: () => Promise<void>;
    fetchBans: () => Promise<void>;
    fetchInvites: () => Promise<void>;
    setMembers: (members: HallMember[]) => void;
    setRoles: (roles: Role[]) => void;
    setBans: (bans: HallBan[]) => void;
    setInvites: (invites: HallInvite[]) => void;

    // Helpers
    getCurrentHallId: () => string | null;
    isCurrentHallOwner: (userId: string) => boolean;
    canAccess: () => boolean;
};

export const useHallStore = create<HallState>()(
    persist(
        (set, get) => ({
            halls: [],
            selectedHallId: null,
            selectedHall: null,
            members: [],
            roles: [],
            bans: [],
            invites: [],
            loading: false,
            error: null,

            // ===== Hall CRUD =====
            fetchHalls: async () => {
                set({ loading: true, error: null });
                try {
                    const halls = await getUserHalls();
                    if (halls) {
                        set({ halls, loading: false });
                    } else {
                        set({ error: "Failed to fetch halls", loading: false });
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error ? error.message : "Failed to fetch halls",
                        loading: false,
                    });
                }
            },

            selectHall: async (hallId: string) => {
                set({ loading: true, error: null, selectedHallId: hallId });
                try {
                    const hall = await getHall(hallId);
                    if (hall) {
                        set({ selectedHall: hall, loading: false });
                        // Fetch associated data
                        await Promise.all([
                            get().fetchMembers(),
                            get().fetchRoles(),
                            get().fetchBans(),
                            get().fetchInvites(),
                        ]);
                    } else {
                        set({ error: "Failed to fetch hall", loading: false });
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error ? error.message : "Failed to select hall",
                        loading: false,
                    });
                }
            },

            setSelectedHall: (hall: Hall | null) => {
                set({
                    selectedHall: hall,
                    selectedHallId: hall?.id || null,
                });
            },

            addHall: (hall: Hall) => {
                set((state) => {
                    const exists = state.halls.some((h) => h.id === hall.id);
                    if (exists) return state;
                    return { halls: [...state.halls, hall] };
                });
            },

            removeHall: (hallId: string) => {
                set((state) => ({
                    halls: state.halls.filter((h) => h.id !== hallId),
                    selectedHallId:
                        state.selectedHallId === hallId ? null : state.selectedHallId,
                    selectedHall:
                        state.selectedHall?.id === hallId ? null : state.selectedHall,
                }));
            },

            updateHall: (hallId: string, updates: Partial<Hall>) => {
                set((state) => ({
                    halls: state.halls.map((h) =>
                        h.id === hallId ? { ...h, ...updates } : h,
                    ),
                    selectedHall:
                        state.selectedHall?.id === hallId
                            ? { ...state.selectedHall, ...updates }
                            : state.selectedHall,
                }));
            },

            clearHalls: () => {
                set({
                    halls: [],
                    selectedHallId: null,
                    selectedHall: null,
                    members: [],
                    roles: [],
                    bans: [],
                    invites: [],
                });
            },

            // ===== Hall Settings =====
            fetchMembers: async () => {
                const hallId = get().selectedHallId;
                if (!hallId) return;

                try {
                    const res = await getHallMembers(hallId);
                    if (res && res.members) {
                        set({ members: res.members, error: null });
                    }
                } catch (error) {
                    console.error("Failed to fetch members:", error);
                }
            },

            fetchRoles: async () => {
                const hallId = get().selectedHallId;
                if (!hallId) return;

                try {
                    const roles = await getRoles(hallId);
                    if (roles) {
                        set({ roles, error: null });
                    }
                } catch (error) {
                    console.error("Failed to fetch roles:", error);
                }
            },

            fetchBans: async () => {
                const hallId = get().selectedHallId;
                if (!hallId) return;

                try {
                    const bans = await getHallBans(hallId);
                    if (bans) {
                        set({ bans, error: null });
                    }
                } catch (error) {
                    console.error("Failed to fetch bans:", error);
                }
            },

            fetchInvites: async () => {
                const hallId = get().selectedHallId;
                if (!hallId) return;

                try {
                    const invites = await getHallInvites(hallId);
                    if (invites) {
                        set({ invites, error: null });
                    }
                } catch (error) {
                    console.error("Failed to fetch invites:", error);
                }
            },

            setMembers: (members: HallMember[]) => set({ members }),
            setRoles: (roles: Role[]) => set({ roles }),
            setBans: (bans: HallBan[]) => set({ bans }),
            setInvites: (invites: HallInvite[]) => set({ invites }),

            // ===== Helpers =====
            getCurrentHallId: () => get().selectedHallId,

            isCurrentHallOwner: (userId: string) => {
                const hall = get().selectedHall;
                return hall?.owner_id === userId;
            },

            canAccess: () => {
                const selectedHall = get().selectedHall;
                return selectedHall !== null;
            },
        }),
        {
            name: "hall-storage",
            partialize: (state) => ({
                halls: state.halls,
                selectedHallId: state.selectedHallId,
            }),
        },
    ),
);

// Selectors
export const useHalls = () => useHallStore((state) => state.halls);
export const useSelectedHallId = () =>
    useHallStore((state) => state.selectedHallId);
export const useSelectedHall = () =>
    useHallStore((state) => state.selectedHall);
export const useHallMembers = () => useHallStore((state) => state.members);
export const useHallRoles = () => useHallStore((state) => state.roles);
export const useHallBans = () => useHallStore((state) => state.bans);
export const useHallInvites = () => useHallStore((state) => state.invites);
export const useHallLoading = () => useHallStore((state) => state.loading);
export const useHallError = () => useHallStore((state) => state.error);

// Actions
export const useFetchHalls = () => useHallStore((state) => state.fetchHalls);
export const useSelectHall = () => useHallStore((state) => state.selectHall);
export const useSetSelectedHall = () =>
    useHallStore((state) => state.setSelectedHall);
export const useAddHall = () => useHallStore((state) => state.addHall);
export const useRemoveHall = () => useHallStore((state) => state.removeHall);
export const useUpdateHall = () => useHallStore((state) => state.updateHall);
export const useClearHalls = () => useHallStore((state) => state.clearHalls);
