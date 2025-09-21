import {create} from "zustand";
import {persist} from "zustand/middleware";
import {UserMeRes} from "@/lib/api";

type UserState = {
    user: UserMeRes | null;

    // Actions
    setUser: (user: UserMeRes) => void;
    clearUser: () => void;
    updateUser: (updates: Partial<UserMeRes>) => void;
    setActive: (active: boolean) => void;

    // Getters
    isAuthenticated: () => boolean;
    getDisplayName: () => string;
};

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,

            // Actions
            setUser: (user: UserMeRes) => set({user}),

            clearUser: () => set({user: null}),

            updateUser: (updates: Partial<UserMeRes>) =>
                set((state) => ({
                    user: state.user ? {...state.user, ...updates} : null
                })),

            setActive: (active: boolean) =>
                set((state) => ({
                    user: state.user ? {...state.user, active} : null
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
        }
    )
);

// Simple hooks
export const useUser = () => useUserStore((state) => state.user);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated());
export const useDisplayName = () => useUserStore((state) => state.getDisplayName());

// Actions
export const useSetUser = () => useUserStore((state) => state.setUser);
export const useClearUser = () => useUserStore((state) => state.clearUser);
export const useUpdateUser = () => useUserStore((state) => state.updateUser);
export const useSetActive = () => useUserStore((state) => state.setActive);

// Combined auth hook
export const useAuth = () => {
    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const displayName = useDisplayName();

    return {user, isAuthenticated, displayName};
};

// Avatar helper
export const useAvatar = () => {
    const user = useUser();
    const displayName = useDisplayName();

    return {
        avatarUrl: user?.avatar_url || "",
        fallback: displayName.charAt(0).toUpperCase(),
        hasAvatar: !!(user?.avatar_url),
    };
};