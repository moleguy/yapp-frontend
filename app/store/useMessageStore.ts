import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Message, getMessages, FetchMessagesOpts } from "@/lib/api";

type MessageState = {
    // Data - organized by room
    messagesByRoom: Record<string, Message[]>;
    loading: boolean;
    error: string | null;

    // Pagination state per room
    cursorState: Record<
        string,
        {
            oldest?: string; // cursor for older messages
            newest?: string; // cursor for newer messages
            hasMore: boolean;
        }
    >;

    // Actions - fetch messages
    fetchMessages: (
        hallId: string,
        roomId: string,
        opts?: FetchMessagesOpts,
    ) => Promise<void>;

    fetchOlderMessages: (hallId: string, roomId: string) => Promise<void>;
    fetchNewerMessages: (hallId: string, roomId: string) => Promise<void>;

    // Actions - manage messages
    addMessage: (roomId: string, message: Message) => void;
    addOptimisticMessage: (roomId: string, message: Message) => void;
    resolveOptimisticMessage: (roomId: string, tempId: string, realMessage: Message) => void;
    rejectOptimisticMessage: (roomId: string, tempId: string) => void;
    updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (roomId: string, messageId: string) => void;
    setMessages: (roomId: string, messages: Message[]) => void;
    clearMessages: (roomId?: string) => void;

    // Helpers
    getMessagesForRoom: (roomId: string) => Message[];
    getMessageById: (roomId: string, messageId: string) => Message | null;
    canLoadOlderMessages: (roomId: string) => boolean;
};

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            messagesByRoom: {},
            loading: false,
            error: null,
            cursorState: {},

            // ===== Fetch Messages =====
            fetchMessages: async (
                hallId: string,
                roomId: string,
                opts?: FetchMessagesOpts,
            ) => {
                set({ loading: true, error: null });
                try {
                    const response = await getMessages(hallId, roomId, opts);
                    if (response) {
                        set((state) => {
                            const messages = response.messages || [];
                            const hasMore = response.has_more || false;

                            // Determine cursors
                            const oldest = messages.length > 0 ? messages[0].id : undefined;
                            const newest = messages.length > 0 ? messages[messages.length - 1].id : undefined;

                            const newState = {
                                messagesByRoom: {
                                    ...state.messagesByRoom,
                                    [roomId]: messages,
                                },
                                cursorState: {
                                    ...state.cursorState,
                                    [roomId]: {
                                        oldest,
                                        newest,
                                        hasMore,
                                    },
                                },
                                loading: false,
                            };

                            console.log(`[MessageStore] Fetched ${messages.length} messages for room ${roomId}`);
                            return newState;
                        });
                    } else {
                        set({ error: "Failed to fetch messages", loading: false });
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error ? error.message : "Failed to fetch messages",
                        loading: false,
                    });
                }
            },

            fetchOlderMessages: async (hallId: string, roomId: string) => {
                const state = get();
                const cursor = state.cursorState[roomId]?.oldest;

                if (!cursor) {
                    console.warn("No cursor for fetching older messages");
                    return;
                }

                set({ loading: true });
                try {
                    const response = await getMessages(hallId, roomId, { before: cursor });
                    if (response) {
                        set((state) => {
                            const newMessages = response.messages || [];
                            const existingMessages = state.messagesByRoom[roomId] || [];
                            const hasMore = response.has_more || false;

                            // Prepend new messages (older = earlier in time, at start of array)
                            const allMessages = [...newMessages, ...existingMessages];

                            const oldest = newMessages.length > 0 ? newMessages[0].id : cursor;

                            return {
                                messagesByRoom: {
                                    ...state.messagesByRoom,
                                    [roomId]: allMessages,
                                },
                                cursorState: {
                                    ...state.cursorState,
                                    [roomId]: {
                                        ...state.cursorState[roomId],
                                        oldest,
                                        hasMore,
                                    },
                                },
                                loading: false,
                            };
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch older messages:", error);
                    set({ loading: false });
                }
            },

            fetchNewerMessages: async (hallId: string, roomId: string) => {
                const state = get();
                const cursor = state.cursorState[roomId]?.newest;

                if (!cursor) {
                    console.warn("No cursor for fetching newer messages");
                    return;
                }

                set({ loading: true });
                try {
                    const response = await getMessages(hallId, roomId, { after: cursor });
                    if (response) {
                        set((state) => {
                            const newMessages = response.messages || [];
                            const existingMessages = state.messagesByRoom[roomId] || [];
                            const hasMore = response.has_more || false;

                            // Append new messages (newer = later in time, at end of array)
                            const allMessages = [...existingMessages, ...newMessages];

                            const newest = newMessages.length > 0 ? newMessages[newMessages.length - 1].id : cursor;

                            return {
                                messagesByRoom: {
                                    ...state.messagesByRoom,
                                    [roomId]: allMessages,
                                },
                                cursorState: {
                                    ...state.cursorState,
                                    [roomId]: {
                                        ...state.cursorState[roomId],
                                        newest,
                                        hasMore,
                                    },
                                },
                                loading: false,
                            };
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch newer messages:", error);
                    set({ loading: false });
                }
            },

            // ===== Add/Update/Delete Messages =====
            addMessage: (roomId: string, message: Message) => {
                set((state) => {
                    const existing = state.messagesByRoom[roomId] || [];
                    // Check if message already exists (avoid duplicates)
                    if (existing.some((m) => m.id === message.id)) {
                        return state;
                    }
                    return {
                        messagesByRoom: {
                            ...state.messagesByRoom,
                            [roomId]: [...existing, message],
                        },
                    };
                });
            },

            addOptimisticMessage: (roomId: string, message: Message) => {
                set((state) => {
                    const existing = state.messagesByRoom[roomId] || [];
                    return {
                        messagesByRoom: {
                            ...state.messagesByRoom,
                            [roomId]: [...existing, { ...message, isOptimistic: true }],
                        },
                    };
                });
            },

            resolveOptimisticMessage: (roomId: string, tempId: string, realMessage: Message) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).map((m) =>
                            m.id === tempId ? { ...realMessage, isOptimistic: false } : m,
                        ),
                    },
                }));
            },

            rejectOptimisticMessage: (roomId: string, tempId: string) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).filter(
                            (m) => m.id !== tempId,
                        ),
                    },
                }));
            },

            updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).map((m) =>
                            m.id === messageId ? { ...m, ...updates } : m,
                        ),
                    },
                }));
            },

            deleteMessage: (roomId: string, messageId: string) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).filter(
                            (m) => m.id !== messageId,
                        ),
                    },
                }));
            },

            setMessages: (roomId: string, messages: Message[]) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: messages,
                    },
                }));
            },

            clearMessages: (roomId?: string) => {
                if (roomId) {
                    set((state) => {
                        const newMap = { ...state.messagesByRoom };
                        delete newMap[roomId];
                        const newCursors = { ...state.cursorState };
                        delete newCursors[roomId];
                        return {
                            messagesByRoom: newMap,
                            cursorState: newCursors,
                        };
                    });
                } else {
                    set({
                        messagesByRoom: {},
                        cursorState: {},
                    });
                }
            },

            // ===== Helpers =====
            getMessagesForRoom: (roomId: string) => {
                return get().messagesByRoom[roomId] || [];
            },

            getMessageById: (roomId: string, messageId: string) => {
                const messages = get().messagesByRoom[roomId] || [];
                return messages.find((m) => m.id === messageId) || null;
            },

            canLoadOlderMessages: (roomId: string) => {
                return get().cursorState[roomId]?.hasMore ?? false;
            },
        }),
        {
            name: "yapp-messages-storage",
            storage: createJSONStorage(() => {
                // Only use localStorage on client-side
                if (typeof window === "undefined") {
                    return {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { },
                    };
                }
                return localStorage;
            }),
            partialize: (state) => ({
                messagesByRoom: state.messagesByRoom,
                cursorState: state.cursorState,
            }),
        },
    ),
);

// Selectors
export const useMessagesForRoom = (roomId: string) =>
    useMessageStore((state) => state.getMessagesForRoom(roomId));

export const useMessageLoading = () =>
    useMessageStore((state) => state.loading);

export const useMessageError = () =>
    useMessageStore((state) => state.error);

export const useCanLoadOlderMessages = (roomId: string) =>
    useMessageStore((state) => state.canLoadOlderMessages(roomId));

// Actions
export const useFetchMessages = () =>
    useMessageStore((state) => state.fetchMessages);

export const useFetchOlderMessages = () =>
    useMessageStore((state) => state.fetchOlderMessages);

export const useFetchNewerMessages = () =>
    useMessageStore((state) => state.fetchNewerMessages);

export const useAddMessage = () =>
    useMessageStore((state) => state.addMessage);

export const useAddOptimisticMessage = () =>
    useMessageStore((state) => state.addOptimisticMessage);

export const useResolveOptimisticMessage = () =>
    useMessageStore((state) => state.resolveOptimisticMessage);

export const useRejectOptimisticMessage = () =>
    useMessageStore((state) => state.rejectOptimisticMessage);

export const useUpdateMessage = () =>
    useMessageStore((state) => state.updateMessage);

export const useDeleteMessage = () =>
    useMessageStore((state) => state.deleteMessage);

export const useSetMessages = () =>
    useMessageStore((state) => state.setMessages);

export const useClearMessages = () =>
    useMessageStore((state) => state.clearMessages);
