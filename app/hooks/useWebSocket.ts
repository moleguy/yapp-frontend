import { useEffect, useRef, useCallback, useState } from "react";
import { getWebSocketUrl } from "@/lib/api";
import { WebSocketClient, getWebSocketClient } from "@/lib/ws";
import { useAddMessage } from "@/app/store/useMessageStore";
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
    // Map of userId -> TypingEntry for users currently typing
    const typingRef = useRef<Map<string, TypingEntry>>(new Map());

    const addMessage = useAddMessage();

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
            // Clear any existing auto-clear timeout for this user
            clearTypingIndicator(data.author_id);

            // Auto-clear after 3s of no further typing events
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
        console.log("WebSocket connected");
        setIsConnected(true);
    }, []);

    const handleClose = useCallback(() => {
        console.log("WebSocket closed");
        setIsConnected(false);
        // Clear all typing indicators on disconnect
        typingRef.current.forEach(({ timeout }) => clearTimeout(timeout));
        typingRef.current.clear();
    }, []);

    // Connect / reconnect when roomId changes
    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        // Disconnect previous room's connection
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
            .then(() => console.log(`WebSocket connected to room: ${roomId}`))
            .catch((error) => console.error("Failed to connect WebSocket:", error));

        return () => {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                setIsConnected(false);
            }
        };
    }, [roomId, hallId, enabled, handleMessage, handleTyping, handleStopTyping, handleError, handleOpen, handleClose]);

    // ---- Outbound actions ----

    const sendMessage = useCallback(
        (content: string) => {
            if (wsRef.current?.isConnected() && roomId) {
                wsRef.current.sendMessage(roomId, content); // ✅ passes roomId
            } else {
                console.warn("WebSocket not connected, cannot send message");
            }
        },
        [roomId],
    );

    const sendTyping = useCallback(() => {
        if (wsRef.current?.isConnected() && roomId) {
            wsRef.current.sendTyping(roomId); // ✅ passes roomId
        }
    }, [roomId]);

    const sendStopTyping = useCallback(() => {
        if (wsRef.current?.isConnected() && roomId) {
            wsRef.current.sendStopTyping(roomId); // ✅ passes roomId
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

/**
 * Debounced typing indicator — sends typing event, auto-stops after 3s of inactivity
 */
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