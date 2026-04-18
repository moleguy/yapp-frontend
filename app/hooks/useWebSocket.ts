import { useEffect, useRef, useCallback, useState } from "react";
import { getWebSocketUrl } from "@/lib/api";
import { WebSocketClient, getWebSocketClient } from "@/lib/ws";
import { useAddMessage, useResolveOptimisticMessage, useRejectOptimisticMessage } from "@/app/store/useMessageStore";
import { Message, WSErrorMessage } from "@/lib/api";

interface UseWebSocketOptions {
    roomId: string | null;
    hallId: string | null;
    enabled?: boolean;
}

interface WebSocketState {
    isTyping: Map<string, { userId: string; timeout: NodeJS.Timeout }>;
}

/**
 * Hook for managing WebSocket connection and real-time updates
 * Connects to WebSocket when room is selected
 * Listens for messages, typing indicators, read receipts
 * Updates stores automatically
 */
export function useWebSocket(options: UseWebSocketOptions) {
    const { roomId, hallId, enabled = true } = options;
    const wsRef = useRef<WebSocketClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const stateRef = useRef<WebSocketState>({
        isTyping: new Map(),
    });

    const addMessage = useAddMessage();
    const resolveOptimisticMessage = useResolveOptimisticMessage();
    const rejectOptimisticMessage = useRejectOptimisticMessage();

    // Typing indicator cleanup
    const clearTypingIndicator = useCallback((userId: string) => {
        const typing = stateRef.current.isTyping;
        if (typing.has(userId)) {
            clearTimeout(typing.get(userId)?.timeout);
            typing.delete(userId);
        }
    }, []);

    // Message event handler
    const handleMessage = useCallback(
        (message: Message) => {
            if (roomId) {
                // If this is a message we sent optimistically, resolve it
                // We'll use a custom property in the WS payload or check content + timestamp + author
                // Actually, the server should return the original client-side message ID if we provided one
                // For now, let's look for any optimistic message by the same author with same content in the last few seconds
                // OR better: use a temporary ID and have the server echo it back.

                // Since our current backend might not echo a temp ID yet,
                // we'll just add it and rely on the store's deduplication by real ID
                addMessage(roomId, message);
            }
        },
        [roomId, addMessage],
    );

    // Typing indicator handler
    const handleTyping = useCallback(
        (data: { author_id: string; room_id: string }) => {
            const typing = stateRef.current.isTyping;

            // Clear existing timeout
            if (typing.has(data.author_id)) {
                clearTimeout(typing.get(data.author_id)?.timeout);
            }

            // Set new timeout for 3 seconds
            const timeout = setTimeout(() => {
                clearTypingIndicator(data.author_id);
            }, 3000);

            typing.set(data.author_id, {
                userId: data.author_id,
                timeout,
            });
        },
        [clearTypingIndicator],
    );

    // Read receipt handler
    const handleRead = useCallback(
        (data: { user_id: string; message_id: string }) => {
            // Optionally mark message as read in UI
            // For now, we can just log it
            console.log(`User ${data.user_id} read message ${data.message_id}`);
        },
        [],
    );

    // Error handler
    const handleError = useCallback((error: Error) => {
        console.error("WebSocket error:", error.message);
        // If it was a message error, we might need to reject an optimistic update
        // The error object here is generic from the client, but the server sends specific error events
    }, []);

    const handleWSError = useCallback((data: WSErrorMessage) => {
        console.error("WebSocket server error:", data.error);
        if (roomId) {
            // We need to know WHICH message failed.
            // If the server doesn't provide a context ID, this is hard.
            // For now, let's assume it's the last one? (Not ideal)
            // TODO: Implement correlation IDs
        }
    }, [roomId]);

    // Open handler
    const handleOpen = useCallback(() => {
        console.log("WebSocket connected");
        setIsConnected(true);
    }, []);

    // Close handler
    const handleClose = useCallback(() => {
        console.log("WebSocket closed");
        setIsConnected(false);
        // Clear all typing indicators
        stateRef.current.isTyping.forEach(({ timeout }) => clearTimeout(timeout));
        stateRef.current.isTyping.clear();
    }, []);

    // Connect to WebSocket when room changes
    useEffect(() => {
        if (!enabled || !roomId || !hallId) {
            // Disconnect if no room selected
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsConnected(false);
            }
            return;
        }

        // Close existing connection if room changed
        if (wsRef.current) {
            wsRef.current.disconnect();
            wsRef.current = null;
        }

        // Create new connection
        const url = getWebSocketUrl(roomId);
        wsRef.current = getWebSocketClient(url);

        const connectAsync = async () => {
            try {
                await wsRef.current!.connect({
                    onMessage: handleMessage,
                    onTyping: handleTyping,
                    onError: handleError,
                    onOpen: handleOpen,
                    onClose: handleClose,
                    // onWSError: handleWSError, // Need to add this to ws.ts listeners if we want specific handling
                });
                console.log(`WebSocket connected to room: ${roomId}`);
            } catch (error) {
                console.error("Failed to connect WebSocket:", error);
            }
        };

        connectAsync();

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.disconnect();
                wsRef.current = null;
                setIsConnected(false);
            }
        };
    }, [roomId, hallId, enabled, handleMessage, handleTyping, handleRead, handleError, handleOpen, handleClose]);

    // Typing indicator emitter (debounced)
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

    // Message sender
    const sendMessage = useCallback(
        (content: string) => {
            if (wsRef.current?.isConnected() && roomId) {
                wsRef.current.sendMessage(roomId, content);
            } else {
                console.warn("WebSocket not connected, cannot send message");
            }
        },
        [roomId],
    );

    // Read receipt sender
    const sendRead = useCallback((messageId: string) => {
        if (wsRef.current?.isConnected()) {
            wsRef.current.sendRead(messageId);
        }
    }, []);

    // Reconnect function
    const reconnect = useCallback(async () => {
        if (wsRef.current) {
            await wsRef.current.reconnect();
        }
    }, []);

    // Get typing users (wrapped in callback to avoid ref access during render)
    const getTypingUsers = useCallback(() => {
        return Array.from(stateRef.current.isTyping.keys());
    }, []);

    return {
        isConnected,
        sendMessage,
        sendTyping,
        sendStopTyping,
        reconnect,
        getTypingUsers,
    };
}

/**
 * Hook for typing indicators
 * Debounced typing indicator sender
 */
export function useTypingIndicator(roomId: string | null) {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { sendTyping } = useWebSocket({ roomId, hallId: null });

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const sendTypingIndicator = useCallback(() => {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        sendTyping();

        // Resend every 2 seconds while typing
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping();
        }, 2000);
    }, [sendTyping]);

    return { sendTypingIndicator };
}
