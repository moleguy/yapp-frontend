"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { globalWebSocketManager } from "@/lib/globalWebSocket";
import { WSMessage } from "@/lib/api";
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
    const [isConnected, setIsConnected] = useState(false);
    const typingRef = useRef<Map<string, TypingEntry>>(new Map());
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // FIX: Pull addMessage directly from the store
    const addMessage = useMessageStore((state) => state.addMessage);

    const clearTypingIndicator = useCallback((userId: string) => {
        const entry = typingRef.current.get(userId);
        if (entry) {
            clearTimeout(entry.timeout);
            typingRef.current.delete(userId);
        }
    }, []);

    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            return;
        }

        // Set up message handlers for current room
        const handleMessage = (message: WSMessage) => {
            try {
                if (message.room_id === roomId) {
                    switch (message.type) {
                        case 'text':
                            addMessage(roomId, message as Message);
                            break;
                        case 'edit':
                            useMessageStore.getState().updateMessage(roomId, message.id, message);
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
                                    created_at: new Date().toISOString()
                                });
                            } else {
                                useReactionStore.getState().removeReaction(roomId, message.message_id, message.user_id, message.emoji);
                            }
                            break;
                        case 'typing':
                            clearTypingIndicator(message.author_id);
                            const timeout = setTimeout(() => {
                                clearTypingIndicator(message.author_id);
                            }, 3000);
                            typingRef.current.set(message.author_id, { userId: message.author_id, timeout });
                            break;
                        case 'stop_typing':
                            clearTypingIndicator(message.author_id);
                            break;
                        case 'join':
                            console.log(`User ${message.author_id} joined room ${message.room_id}`);
                            break;
                        case 'leave':
                            console.log(`User ${message.author_id} left room ${message.room_id}`);
                            break;
                    }
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error, "Message:", message);
            }
        };

        // Subscribe to global WebSocket events
        const unsubscribe = globalWebSocketManager.on('*', handleMessage);
        unsubscribeRef.current = unsubscribe;

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [roomId, hallId, enabled, addMessage, clearTypingIndicator]);

    const sendMessage = useCallback(
        (content: string) => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "text",
                    room_id: roomId,
                    content,
                    sent_at: new Date().toISOString(),
                    mention_everyone: false,
                    mentions: [],
                    attachments: []
                });
            }
        },
        [roomId],
    );

    const sendEdit = useCallback(
        (messageId: string, content: string) => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "edit",
                    room_id: roomId,
                    id: messageId,
                    content,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    const sendDelete = useCallback(
        (messageId: string) => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "delete",
                    room_id: roomId,
                    id: messageId,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    const sendReact = useCallback(
        (messageId: string, emoji: string, action: "add" | "remove") => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "react",
                    room_id: roomId,
                    message_id: messageId,
                    emoji,
                    action,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    const sendTyping = useCallback(
        () => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "typing",
                    room_id: roomId,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    const sendStopTyping = useCallback(
        () => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "stop_typing",
                    room_id: roomId,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    const sendRead = useCallback(
        (messageId: string) => {
            if (globalWebSocketManager.isConnected && roomId) {
                globalWebSocketManager.send({
                    type: "read",
                    room_id: roomId,
                    message_id: messageId,
                    sent_at: new Date().toISOString()
                });
            }
        },
        [roomId],
    );

    useEffect(() => {
        // Update connection state based on global manager
        const updateConnectionState = () => {
            setIsConnected(globalWebSocketManager.isConnected);
        };

        // Listen to connection events
        const unsubscribeOpen = globalWebSocketManager.on('open', updateConnectionState);
        const unsubscribeClose = globalWebSocketManager.on('close', updateConnectionState);

        return () => {
            unsubscribeOpen();
            unsubscribeClose();
        };
    }, []);

    return {
        isConnected,
        sendMessage,
        sendEdit,
        sendDelete,
        sendReact,
        sendTyping,
        sendStopTyping,
        sendRead,
        typingUsers: Array.from(typingRef.current.values()).map(entry => entry.userId),
        getTypingUsers: () => Array.from(typingRef.current.values()).map(entry => entry.userId),
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