"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { WebSocketClient } from "@/lib/ws";
import { WSMessage } from "@/lib/api";
import { useMessageStore } from "@/app/store/useMessageStore";
import { useSelectedHallId } from "@/app/store/useHallStore";
import { useReactionStore } from "@/app/store/useReactionStore";
import { useUserStore } from "@/app/store/useUserStore";

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

    const addMessage = useMessageStore((state) => state.addMessage);

    const clearTypingIndicator = useCallback((userId: string) => {
        const entry = typingRef.current.get(userId);
        if (entry) {
            clearTimeout(entry.timeout);
            typingRef.current.delete(userId);
        }
    }, []);

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
                if (message.room_id !== roomId) return;

                switch (message.type) {
                    case 'text':
                        // Resolve optimistic message if it exists
                        if (message.id) {
                            useMessageStore.getState().resolveOptimisticMessage(roomId, message.id, message as any);
                        } else {
                            addMessage(roomId, message as any);
                        }
                        break;
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
                        clearTypingIndicator(message.author_id);
                        const timeout = setTimeout(() => clearTypingIndicator(message.author_id), 3000);
                        typingRef.current.set(message.author_id, { userId: message.author_id, timeout });
                        break;
                    }
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
            // Add optimistic message locally
            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: any = {
                id: tempId,
                room_id: roomId,
                author_id: useUserStore.getState().user?.id,
                content,
                sent_at: new Date().toISOString(),
                edited_at: null,
                deleted_at: null,
                author: useUserStore.getState().user,
                isOptimistic: true,
            };
            
            addMessage(roomId, optimisticMessage);
            
            // Send via WebSocket
            client.send({
                type: "text",
                room_id: roomId,
                content,
                client_id: tempId, // Important for resolving optimistic message
                sent_at: new Date().toISOString(),
                mention_everyone: false,
                mentions: [],
                attachments: [],
            });
        }
    }, [roomId]);

    const sendEdit = useCallback((messageId: string, content: string) => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "edit",
                room_id: roomId,
                id: messageId,
                content,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

    const sendDelete = useCallback((messageId: string) => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "delete",
                room_id: roomId,
                id: messageId,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

    const sendReact = useCallback((messageId: string, emoji: string, action: "add" | "remove") => {
        const client = WebSocketClient.getGlobalInstance();
        if (client?.isConnected() && roomId) {
            client.send({
                type: "react",
                room_id: roomId,
                message_id: messageId,
                emoji,
                action,
                sent_at: new Date().toISOString(),
            });
        }
    }, [roomId]);

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
        typingUsers: Array.from(typingRef.current.values()).map((e) => e.userId),
        getTypingUsers: () => Array.from(typingRef.current.values()).map((e) => e.userId),
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