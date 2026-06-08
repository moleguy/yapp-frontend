import { create } from "zustand";
import {
  UserPublic,
  getFriends,
  sendFriendRequest,
  respondFriendRequest,
  unfriend,
  getMutualFriends,
} from "@/lib/api";

type FriendsState = {
  friends: UserPublic[];
  loading: boolean;
  error: string | null;
  fetchFriends: () => Promise<void>;
  addFriend: (userId: string) => Promise<boolean>;
  removeFriend: (userId: string) => Promise<boolean>;
  fetchMutualFriends: (userId: string) => Promise<UserPublic[]>;
};

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  loading: false,
  error: null,

  fetchFriends: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getFriends();
      set({ friends: res?.users ?? [], loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load friends",
        loading: false,
      });
    }
  },

  addFriend: async (userId: string) => {
    const res = await sendFriendRequest(userId);
    return !!res;
  },

  removeFriend: async (userId: string) => {
    const ok = await unfriend(userId);
    if (ok) await get().fetchFriends();
    return ok;
  },

  fetchMutualFriends: async (userId: string) => {
    const res = await getMutualFriends(userId);
    return res?.users ?? [];
  },
}));

export const useFriends = () => useFriendsStore((s) => s.friends);
export const useFriendsLoading = () => useFriendsStore((s) => s.loading);
export const useFetchFriends = () => useFriendsStore((s) => s.fetchFriends);
