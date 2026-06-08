import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserMeRes } from "@/lib/api";

type UserState = {
  user: UserMeRes | null;
  /** Local blob preview while a new user profile picture is uploading (not persisted). */
  avatarPreviewUrl: string | null;

  // Actions
  setUser: (user: UserMeRes) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<UserMeRes>) => void;
  setAvatarPreviewUrl: (url: string | null) => void;
  clearAvatarPreviewUrl: () => void;
  setActive: (active: boolean) => void;

  // Getters
  isAuthenticated: () => boolean;
  getDisplayName: () => string;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      avatarPreviewUrl: null,

      // Actions
      setUser: (user: UserMeRes) => set({ user }),

      clearUser: () => set({ user: null, avatarPreviewUrl: null }),

      updateUser: (updates: Partial<UserMeRes>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setAvatarPreviewUrl: (url: string | null) => set({ avatarPreviewUrl: url }),

      clearAvatarPreviewUrl: () => set({ avatarPreviewUrl: null }),

      setActive: (active: boolean) =>
        set((state) => ({
          user: state.user ? { ...state.user, active } : null,
        })),

      // Getters
      isAuthenticated: () => {
        const user = get().user;
        return !!(user?.username || user?.email);
      },

      getDisplayName: () => {
        const user = get().user;
        return user?.display_name || user?.username || "Anonymous";
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

// Simple hooks
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () =>
  useUserStore((state) => state.isAuthenticated());
export const useDisplayName = () =>
  useUserStore((state) => state.getDisplayName());

// Actions
export const useSetUser = () => useUserStore((state) => state.setUser);
export const useClearUser = () => useUserStore((state) => state.clearUser);
export const useUpdateUser = () => useUserStore((state) => state.updateUser);
export const useSetAvatarPreviewUrl = () => useUserStore((state) => state.setAvatarPreviewUrl);
export const useClearAvatarPreviewUrl = () => useUserStore((state) => state.clearAvatarPreviewUrl);
export const useSetActive = () => useUserStore((state) => state.setActive);

// Combined auth hook
export const useAuth = () => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const displayName = useDisplayName();

  return { user, isAuthenticated, displayName };
};

// User profile picture helper
export const useAvatar = () => {
  const user = useUser();
  const avatarPreviewUrl = useUserStore((state) => state.avatarPreviewUrl);
  const displayName = useDisplayName();

  const avatarThumbnailUrl =
    avatarPreviewUrl ||
    user?.avatar_thumbnail_url ||
    user?.avatar_url ||
    "";

  return {
    avatarUrl: user?.avatar_url || "",
    avatarThumbnailUrl,
    fallback: displayName.charAt(0).toUpperCase(),
    hasAvatar: !!(avatarPreviewUrl || user?.avatar_url || user?.avatar_thumbnail_url),
    isAvatarPreview: !!avatarPreviewUrl,
  };
};
