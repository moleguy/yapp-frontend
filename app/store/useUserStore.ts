import {create} from "zustand";
import {persist} from "zustand/middleware";

type UserState = {
    username: string | null;
    displayName: string | null;
    email: string | null;
    avatarUrl?: string | null;
    active: boolean;

    setUser: (user: {
        username: string;
        displayName: string;
        email: string;
        avatarUrl?: string;
        active: boolean;
    }) => void;
    clearUser: () => void;
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            username: null,
            displayName: null,
            email: null,
            avatarUrl: null,
            active: false,
            setUser: (user) => set(user),
            clearUser: () =>
                set({
                    username: null,
                    displayName: null,
                    email: null,
                    avatarUrl: null,
                    active: false,
                }),
        }),
        {
            name: "user-storage", // localStorage key
        }
    )
);