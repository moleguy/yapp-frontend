import { create } from "zustand";
import {
  getMyPresence,
  getPresencesForUsers,
  updateMyPresence,
  type PresenceStatus,
  type UserPresenceRes,
} from "@/lib/api";
import { useUserStore } from "@/app/store/useUserStore";

type PresenceState = {
  myStatus: PresenceStatus;
  myStatusLoaded: boolean;
  byUserId: Record<string, PresenceStatus>;
  fetchMyPresence: () => Promise<void>;
  fetchPresencesForUsers: (userIds: string[]) => Promise<void>;
  setUserPresence: (userId: string, status: PresenceStatus) => void;
  setMyPresence: (status: PresenceStatus) => Promise<void>;
};

function applyPresences(
  current: Record<string, PresenceStatus>,
  presences: UserPresenceRes[]
): Record<string, PresenceStatus> {
  const next = { ...current };
  for (const row of presences) {
    next[row.user_id] = row.status;
  }
  return next;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  myStatus: "online",
  myStatusLoaded: false,
  byUserId: {},

  fetchMyPresence: async () => {
    const res = await getMyPresence();
    const userId = useUserStore.getState().user?.id;
    if (res?.status) {
      set((state) => ({
        myStatus: res.status,
        myStatusLoaded: true,
        byUserId: userId
          ? { ...state.byUserId, [userId]: res.status }
          : state.byUserId,
      }));
    } else {
      set({ myStatusLoaded: true });
    }
  },

  fetchPresencesForUsers: async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const presences = await getPresencesForUsers(userIds);
    if (!presences) return;
    set((state) => ({
      byUserId: applyPresences(state.byUserId, presences),
    }));
  },

  setUserPresence: (userId, status) => {
    set((state) => ({
      byUserId: { ...state.byUserId, [userId]: status },
    }));
  },

  setMyPresence: async (status) => {
    const userId = useUserStore.getState().user?.id;
    set((state) => ({
      myStatus: status,
      byUserId: userId
        ? { ...state.byUserId, [userId]: status }
        : state.byUserId,
    }));
    const res = await updateMyPresence(status);
    if (res?.status) {
      set((state) => ({
        myStatus: res.status,
        byUserId: userId
          ? { ...state.byUserId, [userId]: res.status }
          : state.byUserId,
      }));
    }
  },
}));

export const useMyPresence = () => usePresenceStore((s) => s.myStatus);
export const useMyPresenceLoaded = () => usePresenceStore((s) => s.myStatusLoaded);
export const usePresenceByUserId = () => usePresenceStore((s) => s.byUserId);
export const useSetMyPresence = () => usePresenceStore((s) => s.setMyPresence);
