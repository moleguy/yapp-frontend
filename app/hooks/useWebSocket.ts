"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getWebSocketUrl } from "@/lib/api";
import { WebSocketClient, getGlobalWebSocketClient, ensureWebSocketConnection } from "@/lib/ws";
// FIX: Import useMessageStore directly
import { useMessageStore } from "@/app/store/useMessageStore";
import { useSelectedHallId } from "@/app/store/useHallStore";
import { useReactionStore } from "@/app/store/useReactionStore";
import { Message } from "@/lib/api";

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
    const wsRef = useRef<WebSocketClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const typingRef = useRef<Map<string, TypingEntry>>(new Map());
    const listenersRef = useRef<any>(null);
    const roomIdRef = useRef<string | null>(null);

    // FIX: Pull addMessage directly from the store
    const addMessage = useMessageStore((state) => state.addMessage);

    const clearTypingIndicator = useCallback((userId: string) => {
        const entry = typingRef.current.get(userId);
        if (entry) {
            clearTimeout(entry.timeout);
            typingRef.current.delete(userId);
        }
    }, []);

    // Initialize listeners once with stable references
    if (!listenersRef.current) {
        listenersRef.current = {
            onMessage: (message: Message) => {
                const currentRoomId = roomIdRef.current;
                if (currentRoomId) {
                    useMessageStore.getState().addMessage(currentRoomId, message);
                }
            },
            onEdit: (message: Partial<Message> & { id: string }) => {
                const currentRoomId = roomIdRef.current;
                if (currentRoomId) {
                    useMessageStore.getState().updateMessage(currentRoomId, message.id, message);
                }
            },
            onDelete: (data: { id: string }) => {
                const currentRoomId = roomIdRef.current;
                if (currentRoomId) {
                    useMessageStore.getState().deleteMessage(currentRoomId, data.id);
                }
            },
            onReact: (data: { message_id: string; user_id: string; emoji: string; action: "add" | "remove" }) => {
                const currentRoomId = roomIdRef.current;
                if (currentRoomId) {
                    if (data.action === "add") {
                        useReactionStore.getState().addReaction(currentRoomId, data.message_id, {
                            message_id: data.message_id,
                            user_id: data.user_id,
                            emoji: data.emoji,
                            created_at: new Date().toISOString()
                        });
                    } else {
                        useReactionStore.getState().removeReaction(currentRoomId, data.message_id, data.user_id, data.emoji);
                    }
                }
            },
            onTyping: (data: { author_id: string; room_id: string }) => {
                clearTypingIndicator(data.author_id);
                const timeout = setTimeout(() => {
                    clearTypingIndicator(data.author_id);
                }, 3000);
                typingRef.current.set(data.author_id, { userId: data.author_id, timeout });
            },
            onStopTyping: (data: { author_id: string; room_id: string }) => {
                clearTypingIndicator(data.author_id);
            },
            onJoin: (data: { author_id: string; room_id: string }) => {
                console.log(`User ${data.author_id} joined room ${data.room_id}`);
            },
            onLeave: (data: { author_id: string; room_id: string }) => {
                console.log(`User ${data.author_id} left room ${data.room_id}`);
            },
            onError: (error: Error) => {
                console.error("WebSocket error:", error.message);
            },
            onOpen: () => {
                setIsConnected(true);
            },
            onClose: () => {
                setIsConnected(false);
                typingRef.current.forEach(({ timeout }) => clearTimeout(timeout));
                typingRef.current.clear();
            },
        };
    }

    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            return;
        }

        // Update current roomId ref
        roomIdRef.current = roomId;

        // Get global WebSocket client
        const client = getGlobalWebSocketClient();
        wsRef.current = client;

        // Connect if not already connected
        ensureWebSocketConnection()
            .then(() => {
                if (client && listenersRef.current) {
                    client.on(listenersRef.current);
                }
            })
            .catch((error) => console.error("Failed to connect WebSocket:", error));

        return () => {
            // Don't disconnect global connection on unmount
            // Just clear the reference
            wsRef.current = null;
        };
    }, [roomId, hallId, enabled]);

    const sendMessage = useCallback(
        (content: string) => {
            if (wsRef.current?.isConnected() && roomId) {
                wsRef.current.sendMessage(roomId, content);
            }
        },
        [roomId],
    );

    const sendTyping = useCallback(() => {
        if (wsRef.current?.isConnected() && roomId) {
            wsRef.current.sendTyping(roomId);
        }
    }, [roomId]);

    const sendStopTyping = useCallback(() => {
        if (wsRef.current?.isConnected() && roomId) {
            wsRef.current.sendStopTyping(roomId);
        }
    }, [roomId]);

    const sendRead = useCallback((messageId: string) => {
        if (wsRef.current?.isConnected()) {
            wsRef.current.sendRead(messageId);
        }
    }, []);

    const reconnect = useCallback(async () => {
        if (wsRef.current) {
            await wsRef.current.reconnect();
        }
    }, []);

    const getTypingUsers = useCallback(() => {
        return Array.from(typingRef.current.keys());
    }, []);

    return {
        isConnected,
        sendMessage,
        sendTyping,
        sendStopTyping,
        sendRead,
        reconnect,
        getTypingUsers,
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