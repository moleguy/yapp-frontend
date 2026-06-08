"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { WebSocketClient } from "@/lib/ws";
import {
    WSMessage,
    Message,
    updateMessage,
    deleteMessage,
    addReaction,
    removeReaction,
} from "@/lib/api";
import { useMessageStore } from "@/app/store/useMessageStore";
import { useSelectedHallId } from "@/app/store/useHallStore";
import { useReactionStore } from "@/app/store/useReactionStore";
import { useUserStore } from "@/app/store/useUserStore";
import { useHallStore } from "@/app/store/useHallStore";
import { enrichMessageAuthor } from "@/lib/messageUtils";

interface UseWebSocketOptions {
    roomId: string | null;
    hallId: string | null;
    enabled?: boolean;
}

interface TypingEntry {
    userId: string;
    timeout: NodeJS.Timeout;
}

export function useWebSocket(options: UseWebSocketOptions) {
    const { roomId, hallId, enabled = true } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingRef = useRef<Map<string, TypingEntry>>(new Map());
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const addMessage = useMessageStore((state) => state.addMessage);

    const enrichWsMessage = useCallback((msg: Message): Message => {
        const currentUser = useUserStore.getState().user;
        const hallMembers = useHallStore.getState().members;
        return enrichMessageAuthor(msg, currentUser, hallMembers);
    }, []);

    const clearTypingIndicator = useCallback((userId: string) => {
        const entry = typingRef.current.get(userId);
        if (entry) {
            clearTimeout(entry.timeout);
            typingRef.current.delete(userId);
            setTypingUsers(Array.from(typingRef.current.keys()));
        }
    }, []);

    const setTypingUser = useCallback((userId: string) => {
        clearTypingIndicator(userId);
        const timeout = setTimeout(() => clearTypingIndicator(userId), 3000);
        typingRef.current.set(userId, { userId, timeout });
        setTypingUsers(Array.from(typingRef.current.keys()));
    }, [clearTypingIndicator]);

    // Message handler + room subscription
    const handleMessageRef = useRef<(message: WSMessage) => void>(() => {});

    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            return;
        }

        // Create stable message handler
        handleMessageRef.current = (message: WSMessage): void => {
            try {
                // Connection-level events are not scoped to the active room
                if (message.type === "subscriptions_synced") return;

                if (message.room_id !== roomId) return;

                switch (message.type) {
                    case 'text': {
                        const store = useMessageStore.getState();
                        const currentUserId = useUserStore.getState().user?.id;

                        // Strategy 1: server echoed temp_id back (ideal, requires Go server support)
                        const echoedTempId = (message as any).temp_id as string | undefined;
                        if (echoedTempId) {
                            store.resolveOptimisticMessage(
                                roomId,
                                echoedTempId,
                                enrichWsMessage(message as Message)
                            );
                            break;
                        }

                        // Strategy 2: match by author + content against pending optimistic messages.
                        // Handles the case where the Go server strips temp_id from the broadcast.
                        if (message.author_id === currentUserId) {
                            const roomMessages = store.messagesByRoom[roomId] || [];
                            const echoWindowMs = 10_000; // 10 seconds — generous for slow connections
                            const echoTime = new Date(message.sent_at).getTime();

                            const matched = roomMessages.find(
                                (m) =>
                                    m.isOptimistic &&
                                    m.author_id === message.author_id &&
                                    m.content === message.content &&
                                    Math.abs(new Date(m.sent_at).getTime() - echoTime) < echoWindowMs
                            );

                            if (matched) {
                                store.resolveOptimisticMessage(
                                    roomId,
                                    matched.id,
                                    enrichWsMessage(message as Message)
                                );
                                break;
                            }
                        }

                        // Strategy 3: genuine new message from another user (or unmatched echo)
                        addMessage(roomId, enrichWsMessage(message as Message));
                        break;
                    }
                    case 'edit':
                        useMessageStore.getState().updateMessage(roomId, message.id, message as any);
                        break;
                    case 'delete':
                        useMessageStore.getState().deleteMessage(roomId, message.id);
                        break;
                    case 'react':
                        if (message.action === 'add') {
                            useReactionStore.getState().addReaction(roomId, message.message_id, {
                                message_id: message.message_id,
                                user_id: message.user_id,
                                emoji: message.emoji,
                                created_at: new Date().toISOString(),
                            });
                        } else {
                            useReactionStore.getState().removeReaction(roomId, message.message_id, message.user_id, message.emoji);
                        }
                        break;
                    case 'typing': {
                        const typingUser = (message as { typing_user?: string }).typing_user || message.author_id;
                        setTypingUser(typingUser);
                        break;
                    }
                    case 'stop_typing': {
                        const typingUser = (message as { typing_user?: string }).typing_user || message.author_id;
                        clearTypingIndicator(typingUser);
                        break;
                    }
                    case 'join':
                        console.log(`User ${message.author_id} joined room ${message.room_id}`);
                        break;
                    case 'leave':
                        console.log(`User ${message.author_id} left room ${message.room_id}`);
                        break;
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error, "Message:", message);
            }
        };

        // Ensure global connection is up then subscribe
        WebSocketClient.ensureGlobalConnection()
            .catch((error) => console.error("Failed to connect WebSocket:", error));

        const unsubscribe = WebSocketClient.getGlobalInstance().on('*', handleMessageRef.current);
        unsubscribeRef.current = unsubscribe;

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [roomId, hallId, enabled]); // Remove unstable dependencies

    // Connection state tracking
    const isConnectedRef = useRef(false);
    
    useEffect(() => {
        const updateConnectionState = () => {
            const connected = WebSocketClient.getGlobalInstance()?.isConnected() || false;
            // Only update state if connection state actually changed
            if (isConnectedRef.current !== connected) {
                isConnectedRef.current = connected;
                setIsConnected(connected);
            }
        };

        const unsubscribeOpen = WebSocketClient.getGlobalInstance().on('open', updateConnectionState);
        const unsubscribeClose = WebSocketClient.getGlobalInstance().on('close', updateConnectionState);

        // Set initial state
        updateConnectionState();

        return () => {
            unsubscribeOpen?.();
            unsubscribeClose?.();
        };
    }, []);

    const sendMessage = useCallback((content: string) => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            const currentUser = useUserStore.getState().user;

            if (!currentUser) {
                console.error("No current user data available for optimistic message");
                return;
            }

            // Use crypto.randomUUID for a unique tempId per message (safe for rapid sends)
            const tempId = crypto.randomUUID();
            const sentAt = new Date().toISOString();

            // Insert via addOptimisticMessage (not addMessage) so it bypasses the
            // id-dedupe guard and is clearly flagged as pending resolution
            const optimisticMessage: any = {
                id: tempId,
                tempId,
                room_id: roomId,
                author_id: currentUser.id,
                content,
                sent_at: sentAt,
                edited_at: null,
                deleted_at: null,
                author: {
                    id: currentUser.id,
                    username: currentUser.username,
                    display_name: currentUser.display_name,
                    email: currentUser.email,
                    avatar_url: currentUser.avatar_url,
                },
                isOptimistic: true,
            };

            useMessageStore.getState().addOptimisticMessage(roomId, optimisticMessage);

            // Include temp_id so the server echo carries it back for precise resolution
            client.send({
                type: "text",
                room_id: roomId,
                content,
                sent_at: sentAt,
                temp_id: tempId,
                mention_everyone: false,
                mentions: [],
                attachments: [],
            });
        }
    }, [roomId]);

    const sendEdit = useCallback(async (messageId: string, content: string) => {
        if (!hallId || !roomId) return;
        const updated = await updateMessage(hallId, roomId, messageId, { content });
        if (updated) {
            useMessageStore.getState().updateMessage(roomId, messageId, updated);
        }
    }, [hallId, roomId]);

    const sendDelete = useCallback(async (messageId: string) => {
        if (!hallId || !roomId) return;
        const ok = await deleteMessage(hallId, roomId, messageId);
        if (ok) {
            useMessageStore.getState().deleteMessage(roomId, messageId);
        }
    }, [hallId, roomId]);

    const sendReact = useCallback(async (messageId: string, emoji: string, action: "add" | "remove") => {
        if (!hallId || !roomId) return;
        const ok =
            action === "add"
                ? await addReaction(hallId, roomId, messageId, emoji)
                : await removeReaction(hallId, roomId, messageId, emoji);
        if (!ok) return;
        const userId = useUserStore.getState().user?.id;
        if (!userId) return;
        if (action === "add") {
            useReactionStore.getState().addReaction(roomId, messageId, {
                message_id: messageId,
                user_id: userId,
                emoji,
                created_at: new Date().toISOString(),
            });
        } else {
            useReactionStore.getState().removeReaction(roomId, messageId, userId, emoji);
        }
    }, [hallId, roomId]);

    const sendTyping = useCallback(() => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "typing",
                room_id: roomId,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

    const sendStopTyping = useCallback(() => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "stop_typing",
                room_id: roomId,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

    const sendRead = useCallback((messageId: string) => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "read",
                room_id: roomId,
                message_id: messageId,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

    return {
        isConnected,
        sendMessage,
        sendEdit,
        sendDelete,
        sendReact,
        sendTyping,
        sendStopTyping,
        sendRead,
        typingUsers,
        getTypingUsers: () => typingUsers,
    };
}

export function useTypingIndicator(roomId: string | null) {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hallId = useSelectedHallId();
    const { sendTyping, sendStopTyping } = useWebSocket({
        roomId,
        hallId,
        enabled: !!roomId && !!hallId,
    });

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    const sendTypingIndicator = useCallback(() => {
        sendTyping();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendStopTyping();
        }, 3000);
    }, [sendTyping, sendStopTyping]);

    return { sendTypingIndicator };
}