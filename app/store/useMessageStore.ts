import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from 'zustand/react/shallow';
import { Message, getMessages, FetchMessagesOpts } from "@/lib/api";

const EMPTY_MESSAGES: Message[] = [];

type MessageState = {
    messagesByRoom: Record<string, Message[]>;
    loading: boolean;
    error: string | null;
    cursorState: Record<string, { oldest?: string; newest?: string; hasMore: boolean }>;

    fetchMessages: (hallId: string, roomId: string, opts?: FetchMessagesOpts) => Promise<void>;
    fetchOlderMessages: (hallId: string, roomId: string) => Promise<void>;
    fetchNewerMessages: (hallId: string, roomId: string) => Promise<void>;
    addMessage: (roomId: string, message: Message) => void;
    addOptimisticMessage: (roomId: string, message: Message) => void;
    resolveOptimisticMessage: (roomId: string, tempId: string, realMessage: Message) => void;
    rejectOptimisticMessage: (roomId: string, tempId: string) => void;
    updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
    deleteMessage: (roomId: string, messageId: string) => void;
    setMessages: (roomId: string, messages: Message[]) => void;
    clearMessages: (roomId?: string) => void;
    getMessagesForRoom: (roomId: string) => Message[];
};

export const useMessageStore = create<MessageState>()(
    persist(
        (set, get) => ({
            messagesByRoom: {},
            loading: false,
            error: null,
            cursorState: {},

            fetchMessages: async (hallId, roomId, opts) => {
                set({ loading: true, error: null });
                try {
                    const response = await getMessages(hallId, roomId, opts);
                    if (response) {
                        const messages = response.messages || [];
                        const hasMore = response.has_more || false;
                        const oldest = messages.length > 0 ? messages[0].id : undefined;
                        const newest = messages.length > 0 ? messages[messages.length - 1].id : undefined;

                        set((state) => ({
                            messagesByRoom: { ...state.messagesByRoom, [roomId]: messages },
                            cursorState: {
                                ...state.cursorState,
                                [roomId]: { oldest, newest, hasMore }
                            },
                            loading: false,
                        }));
                    }
                } catch (error) {
                    set({ error: "Failed to fetch", loading: false });
                }
            },

            fetchOlderMessages: async (hallId, roomId) => {
                const state = get();
                const cursor = state.cursorState[roomId]?.oldest;
                if (!cursor) return;
                set({ loading: true });
                try {
                    const response = await getMessages(hallId, roomId, { before: cursor });
                    if (response) {
                        set((state) => {
                            const newMsgs = response.messages || [];
                            const existing = state.messagesByRoom[roomId] || [];
                            return {
                                messagesByRoom: { ...state.messagesByRoom, [roomId]: [...newMsgs, ...existing] },
                                cursorState: {
                                    ...state.cursorState,
                                    [roomId]: { ...state.cursorState[roomId], oldest: newMsgs[0]?.id || cursor, hasMore: response.has_more }
                                },
                                loading: false
                            };
                        });
                    }
                } catch (e) { set({ loading: false }); }
            },

            fetchNewerMessages: async (hallId, roomId) => {
                const state = get();
                const cursor = state.cursorState[roomId]?.newest;
                if (!cursor) return;
                set({ loading: true });
                try {
                    const response = await getMessages(hallId, roomId, { after: cursor });
                    if (response) {
                        set((state) => {
                            const newMsgs = response.messages || [];
                            const existing = state.messagesByRoom[roomId] || [];
                            return {
                                messagesByRoom: { ...state.messagesByRoom, [roomId]: [...existing, ...newMsgs] },
                                cursorState: {
                                    ...state.cursorState,
                                    [roomId]: { ...state.cursorState[roomId], newest: newMsgs[newMsgs.length - 1]?.id || cursor, hasMore: response.has_more }
                                },
                                loading: false
                            };
                        });
                    }
                } catch (e) { set({ loading: false }); }
            },

            addMessage: (roomId, message) => {
                set((state) => {
                    const existing = state.messagesByRoom[roomId] || [];
                    if (existing.some((m) => m.id === message.id)) return state;
                    return {
                        messagesByRoom: { ...state.messagesByRoom, [roomId]: [...existing, message] }
                    };
                });
            },

            addOptimisticMessage: (roomId, message) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: [...(state.messagesByRoom[roomId] || []), { ...message, isOptimistic: true }]
                    }
                }));
            },

            resolveOptimisticMessage: (roomId, tempId, realMessage) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).map((m) =>
                            m.id === tempId ? { ...realMessage, isOptimistic: false } : m
                        ),
                    },
                }));
            },

            rejectOptimisticMessage: (roomId, tempId) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).filter((m) => m.id !== tempId),
                    },
                }));
            },

            updateMessage: (roomId, messageId, updates) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).map((m) =>
                            m.id === messageId ? { ...m, ...updates } : m
                        ),
                    },
                }));
            },

            deleteMessage: (roomId, messageId) => {
                set((state) => ({
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: (state.messagesByRoom[roomId] || []).filter((m) => m.id !== messageId),
                    },
                }));
            },

            setMessages: (roomId, messages) => {
                set((state) => ({
                    messagesByRoom: { ...state.messagesByRoom, [roomId]: messages }
                }));
            },

            clearMessages: (roomId) => {
                if (roomId) {
                    set((state) => ({
                        messagesByRoom: { ...state.messagesByRoom, [roomId]: [] }
                    }));
                } else {
                    set({ messagesByRoom: {}, cursorState: {} });
                }
            },

            getMessagesForRoom: (roomId: string) => {
                return get().messagesByRoom[roomId] || EMPTY_MESSAGES;
            },
        }),
        { name: "message-storage" }
    )
);

// HOOKS - Use useShallow to prevent selector-triggered loops
export const useMessagesForRoom = (roomId: string) =>
    useMessageStore(useShallow((state) => state.getMessagesForRoom(roomId)));

export const useFetchMessages = () => useMessageStore((state) => state.fetchMessages);
export const useAddOptimisticMessage = () => useMessageStore((state) => state.addOptimisticMessage);