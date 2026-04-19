"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getWebSocketUrl } from "@/lib/api";
import { WebSocketClient, getWebSocketClient } from "@/lib/ws";
// FIX: Import useMessageStore directly
import { useMessageStore } from "@/app/store/useMessageStore";
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

    // FIX: Pull addMessage directly from the store
    const addMessage = useMessageStore((state) => state.addMessage);

    const clearTypingIndicator = useCallback((userId: string) => {
        const entry = typingRef.current.get(userId);
        if (entry) {
            clearTimeout(entry.timeout);
            typingRef.current.delete(userId);
        }
    }, []);

    const handleMessage = useCallback(
        (message: Message) => {
            if (roomId) {
                addMessage(roomId, message);
            }
        },
        [roomId, addMessage],
    );

    const handleTyping = useCallback(
        (data: { author_id: string; room_id: string }) => {
            clearTypingIndicator(data.author_id);
            const timeout = setTimeout(() => {
                clearTypingIndicator(data.author_id);
            }, 3000);
            typingRef.current.set(data.author_id, { userId: data.author_id, timeout });
        },
        [clearTypingIndicator],
    );

    const handleStopTyping = useCallback(
        (data: { author_id: string; room_id: string }) => {
            clearTypingIndicator(data.author_id);
        },
        [clearTypingIndicator],
    );

    const handleError = useCallback((error: Error) => {
        console.error("WebSocket error:", error.message);
    }, []);

    const handleOpen = useCallback(() => {
        setIsConnected(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsConnected(false);
        typingRef.current.forEach(({ timeout }) => clearTimeout(timeout));
        typingRef.current.clear();
    }, []);

    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        if (wsRef.current) {
            wsRef.current.disconnect();
            wsRef.current = null;
        }

        const url = getWebSocketUrl(roomId);
        wsRef.current = getWebSocketClient(url);

        wsRef.current
            .connect({
                onMessage: handleMessage,
                onTyping: handleTyping,
                onStopTyping: handleStopTyping,
                onError: handleError,
                onOpen: handleOpen,
                onClose: handleClose,
            })
            .catch((error) => console.error("Failed to connect WebSocket:", error));

        return () => {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                setIsConnected(false);
            }
        };
    }, [roomId, hallId, enabled, handleMessage, handleTyping, handleStopTyping, handleError, handleOpen, handleClose]);

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
    const { sendTyping, sendStopTyping } = useWebSocket({ roomId, hallId: null, enabled: !!roomId });

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