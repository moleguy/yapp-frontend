import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  Message,
  getMessages,
  FetchMessagesOpts,
  Reaction,
  ReactionGroup,
} from "@/lib/api";
import { useReactionStore } from "./useReactionStore";

const EMPTY_MESSAGES: Message[] = [];

type Cursor = {
  oldest?: string;
  newest?: string;
  hasMore: boolean;
};

type MessageState = {
  messagesByRoom: Record<string, Message[]>;
  cursorState: Record<string, { oldest?: string; newest?: string; hasMore: boolean }>;
  loading: boolean;
  error: string | null;

  fetchMessages: (hallId: string, roomId: string) => Promise<void>;
  fetchOlderMessages: (hallId: string, roomId: string) => Promise<void>;
  fetchNewerMessages: (hallId: string, roomId: string) => Promise<void>;

  addMessage: (roomId: string, message: Message) => void;
  addOptimisticMessage: (roomId: string, message: Message) => void;
  resolveOptimisticMessage: (
    roomId: string,
    tempId: string,
    realMessage: Message
  ) => void;
  rejectOptimisticMessage: (roomId: string, tempId: string) => void;

  updateMessage: (
    roomId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;

  deleteMessage: (roomId: string, messageId: string) => void;

  getMessagesForRoom: (roomId: string) => Message[];
};

function normalizeMessages(messages: Message[]) {
  return messages
    .filter((m) => !m.deleted_at) // soft delete support
    .map((m) => ({
      ...m,
      content: m.content ?? "", // null safety
    }))
    .sort(
      (a, b) =>
        new Date(a.sent_at).getTime() -
        new Date(b.sent_at).getTime()
    );
}

function syncReactions(roomId: string, messages: Message[]) {
  messages.forEach((msg) => {
    if (!msg.reactions) return;

    const flat: Reaction[] = [];

    msg.reactions.forEach((g: ReactionGroup) => {
      (g.user_ids || []).forEach((u) => {
        flat.push({
          message_id: msg.id,
          user_id: u.id,
          emoji: g.emoji,
        });
      });
    });

    useReactionStore
      .getState()
      .setReactions(roomId, msg.id, flat);
  });
}

export const useMessageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      messagesByRoom: {},
      cursorState: {},
      loading: false,
      error: null,

      fetchMessages: async (hallId, roomId) => {
        set({ loading: true, error: null });

        try {
          const res = await getMessages(hallId, roomId, {
            limit: 50,
          });

          const data = res; // Direct response

          if (!data) {
            set({ error: "No response data", loading: false });
            return;
          }

          const messages = normalizeMessages(data.messages || []);
          syncReactions(roomId, messages);

          set({
            messagesByRoom: {
              ...get().messagesByRoom,
              [roomId]: messages,
            },
            cursorState: {
              ...get().cursorState,
              [roomId]: {
                oldest: messages[0]?.id,
                newest: messages[messages.length - 1]?.id,
                hasMore: data.has_more ?? false,
              },
            },
            loading: false,
          });
        } catch (e) {
          set({ error: "Failed to fetch messages", loading: false });
        }
      },

      fetchOlderMessages: async (hallId, roomId) => {
        const cursor = get().cursorState[roomId]?.oldest;
        if (!cursor) return;

        try {
          const res = await getMessages(hallId, roomId, {
            before: cursor,
            limit: 50,
          });

          const data = res;
          if (!data) return;
          
          const newMsgs = normalizeMessages(data?.messages || []);
          syncReactions(roomId, newMsgs);

          set((state) => {
            const existing = state.messagesByRoom[roomId] || [];

            const merged = [...newMsgs, ...existing];

            return {
              messagesByRoom: {
                ...state.messagesByRoom,
                [roomId]: merged,
              },
              cursorState: {
                ...state.cursorState,
                [roomId]: {
                  ...state.cursorState[roomId],
                  oldest: newMsgs[0]?.id || cursor,
                  hasMore: data.has_more ?? false,
                },
              },
            };
          });
        } catch {}
      },

      fetchNewerMessages: async (hallId, roomId) => {
        const cursor = get().cursorState[roomId]?.newest;
        if (!cursor) return;

        try {
          const res = await getMessages(hallId, roomId, {
            after: cursor,
            limit: 50,
          });

          const data = res;
          if (!data) return;
          
          const newMsgs = normalizeMessages(data?.messages || []);
          syncReactions(roomId, newMsgs);

          set((state) => {
            const existing = state.messagesByRoom[roomId] || [];

            const merged = [...existing, ...newMsgs];

            return {
              messagesByRoom: {
                ...state.messagesByRoom,
                [roomId]: merged,
              },
              cursorState: {
                ...state.cursorState,
                [roomId]: {
                  ...state.cursorState[roomId],
                  newest:
                    newMsgs[newMsgs.length - 1]?.id || cursor,
                  hasMore: data.has_more ?? false,
                },
              },
            };
          });
        } catch {}
      },

      addMessage: (roomId, message) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] || [];

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

      addOptimisticMessage: (roomId, message) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: [
              ...(state.messagesByRoom[roomId] || []),
              { ...message, isOptimistic: true },
            ],
          },
        }));
      },

      resolveOptimisticMessage: (roomId, tempId, realMessage) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: (state.messagesByRoom[roomId] || []).map((m) => {
              if (m.id !== tempId && (m as { tempId?: string }).tempId !== tempId) {
                return m;
              }
              return {
                ...realMessage,
                author: realMessage.author ?? m.author,
                isOptimistic: false,
              };
            }),
          },
        }));
      },

      rejectOptimisticMessage: (roomId, tempId) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: (state.messagesByRoom[roomId] || []).filter(
              (m) => m.id !== tempId
            ),
          },
        }));
      },

      updateMessage: (roomId, messageId, updates) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: (state.messagesByRoom[roomId] || []).map(
              (m) =>
                m.id === messageId ? { ...m, ...updates } : m
            ),
          },
        }));
      },

      deleteMessage: (roomId, messageId) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: (state.messagesByRoom[roomId] || []).filter(
              (m) => m.id !== messageId
            ),
          },
        }));
      },

      getMessagesForRoom: (roomId) =>
        get().messagesByRoom[roomId] || EMPTY_MESSAGES,
    }),
    {
      name: "message-storage",
      partialize: (state) => ({
        cursorState: state.cursorState,
      }),
    }
  )
);

// hooks
export const useMessagesForRoom = (roomId: string) =>
  useMessageStore(
    useShallow((s) => s.getMessagesForRoom(roomId))
  );

export const useFetchMessages = () =>
  useMessageStore((s) => s.fetchMessages);

export const useAddMessage = () =>
  useMessageStore((s) => s.addMessage);

export const useAddOptimisticMessage = () =>
  useMessageStore((s) => s.addOptimisticMessage);

export const useResolveOptimisticMessage = () =>
  useMessageStore((s) => s.resolveOptimisticMessage);

export const useUpdateMessage = () =>
  useMessageStore((s) => s.updateMessage);

export const useDeleteMessage = () =>
  useMessageStore((s) => s.deleteMessage);

export const useFetchOlderMessages = () =>
  useMessageStore((s) => s.fetchOlderMessages);

export const useFetchNewerMessages = () =>
  useMessageStore((s) => s.fetchNewerMessages);

export const useMessageLoading = () =>
  useMessageStore((s) => s.loading);

export const useCanLoadOlderMessages = (roomId: string) =>
  useMessageStore((s) => s.cursorState[roomId]?.hasMore ?? false);