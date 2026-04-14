import { create } from "zustand";
import { Reaction } from "@/lib/api";

type ReactionState = {
    // Data - organized by room then message
    reactionsByRoom: Record<string, Record<string, Reaction[]>>;

    // Actions
    addReaction: (roomId: string, messageId: string, reaction: Reaction) => void;
    removeReaction: (
        roomId: string,
        messageId: string,
        userId: string,
        emoji: string,
    ) => void;
    setReactions: (roomId: string, messageId: string, reactions: Reaction[]) => void;
    setAllReactionsForRoom: (roomId: string, reactions: Record<string, Reaction[]>) => void;
    clearReactions: (roomId?: string) => void;

    // Helpers
    getReactionsForMessage: (roomId: string, messageId: string) => Reaction[];
    getReactionCounts: (
        roomId: string,
        messageId: string,
    ) => Record<string, number>;
    userReactedWith: (
        roomId: string,
        messageId: string,
        userId: string,
        emoji: string,
    ) => boolean;
};

export const useReactionStore = create<ReactionState>((set, get) => ({
    reactionsByRoom: {},

    // ===== Add/Remove Reactions =====
    addReaction: (roomId: string, messageId: string, reaction: Reaction) => {
        set((state) => {
            const roomReactions = state.reactionsByRoom[roomId] || {};
            const messageReactions = roomReactions[messageId] || [];

            // Check if this user already reacted with this emoji
            const exists = messageReactions.some(
                (r) => r.user_id === reaction.user_id && r.emoji === reaction.emoji,
            );

            if (exists) return state;

            return {
                reactionsByRoom: {
                    ...state.reactionsByRoom,
                    [roomId]: {
                        ...roomReactions,
                        [messageId]: [...messageReactions, reaction],
                    },
                },
            };
        });
    },

    removeReaction: (
        roomId: string,
        messageId: string,
        userId: string,
        emoji: string,
    ) => {
        set((state) => {
            const roomReactions = state.reactionsByRoom[roomId];
            if (!roomReactions || !roomReactions[messageId]) return state;

            return {
                reactionsByRoom: {
                    ...state.reactionsByRoom,
                    [roomId]: {
                        ...roomReactions,
                        [messageId]: roomReactions[messageId].filter(
                            (r) => !(r.user_id === userId && r.emoji === emoji),
                        ),
                    },
                },
            };
        });
    },

    setReactions: (roomId: string, messageId: string, reactions: Reaction[]) => {
        set((state) => ({
            reactionsByRoom: {
                ...state.reactionsByRoom,
                [roomId]: {
                    ...state.reactionsByRoom[roomId],
                    [messageId]: reactions,
                },
            },
        }));
    },

    setAllReactionsForRoom: (
        roomId: string,
        reactions: Record<string, Reaction[]>,
    ) => {
        set((state) => ({
            reactionsByRoom: {
                ...state.reactionsByRoom,
                [roomId]: reactions,
            },
        }));
    },

    clearReactions: (roomId?: string) => {
        if (roomId) {
            set((state) => {
                const newMap = { ...state.reactionsByRoom };
                delete newMap[roomId];
                return { reactionsByRoom: newMap };
            });
        } else {
            set({ reactionsByRoom: {} });
        }
    },

    // ===== Helpers =====
    getReactionsForMessage: (roomId: string, messageId: string) => {
        return get().reactionsByRoom[roomId]?.[messageId] || [];
    },

    getReactionCounts: (roomId: string, messageId: string) => {
        const reactions = get().getReactionsForMessage(roomId, messageId);
        const counts: Record<string, number> = {};

        reactions.forEach((reaction) => {
            counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
        });

        return counts;
    },

    userReactedWith: (
        roomId: string,
        messageId: string,
        userId: string,
        emoji: string,
    ) => {
        const reactions = get().getReactionsForMessage(roomId, messageId);
        return reactions.some((r) => r.user_id === userId && r.emoji === emoji);
    },
}));

// Selectors
export const useReactionsForMessage = (roomId: string, messageId: string) =>
    useReactionStore((state) =>
        state.getReactionsForMessage(roomId, messageId),
    );

export const useReactionCounts = (roomId: string, messageId: string) =>
    useReactionStore((state) =>
        state.getReactionCounts(roomId, messageId),
    );

export const useUserReacted = (
    roomId: string,
    messageId: string,
    userId: string,
    emoji: string,
) =>
    useReactionStore((state) =>
        state.userReactedWith(roomId, messageId, userId, emoji),
    );

// Actions
export const useAddReaction = () =>
    useReactionStore((state) => state.addReaction);

export const useRemoveReaction = () =>
    useReactionStore((state) => state.removeReaction);

export const useSetReactions = () =>
    useReactionStore((state) => state.setReactions);

export const useSetAllReactionsForRoom = () =>
    useReactionStore((state) => state.setAllReactionsForRoom);

export const useClearReactions = () =>
    useReactionStore((state) => state.clearReactions);
