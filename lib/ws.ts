// WebSocket client for real-time messaging

import { Message, WSMessage, WSTextMessage, WSTypingMessage } from "./api";

export type WebSocketEventListener = {
    onMessage?: (msg: Message) => void;
    onTyping?: (data: { author_id: string; room_id: string }) => void;
    onStopTyping?: (data: { author_id: string; room_id: string }) => void;
    onJoin?: (data: { author_id: string; room_id: string }) => void;
    onLeave?: (data: { author_id: string; room_id: string }) => void;
    onError?: (error: Error) => void;
    onOpen?: () => void;
    onClose?: () => void;
};

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private listeners: WebSocketEventListener = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // ms
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private isManualClose = false;

    constructor(url: string) {
        this.url = url;
    }

    /**
     * Connect to WebSocket with auto-reconnect on failure
     */
    connect(listeners?: WebSocketEventListener): Promise<void> {
        return new Promise((resolve, reject) => {
            if (listeners) {
                this.listeners = listeners;
            }

            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log("WebSocket connected");
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.listeners.onOpen?.();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data: WSMessage = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (error) {
                        console.error("Failed to parse WebSocket message:", error);
                    }
                };

                this.ws.onerror = (error) => {
                    const err = new Error(`WebSocket error: ${error}`);
                    console.error(err);
                    this.listeners.onError?.(err);
                    reject(err);
                };

                this.ws.onclose = () => {
                    console.log("WebSocket closed");
                    this.stopHeartbeat();
                    this.listeners.onClose?.();

                    if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        const delay = this.reconnectDelay * this.reconnectAttempts;
                        console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
                        setTimeout(() => this.connect(this.listeners), delay);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Send a text message
     */
    sendMessage(roomId: string, content: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: "text",
                    room_id: roomId,
                    content: content,
                    sent_at: new Date().toISOString(),
                }),
            );
        } else {
            console.warn("WebSocket not connected, message not sent");
        }
    }

    /**
     * Send typing indicator
     */
    sendTyping(roomId: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: "typing",
                    room_id: roomId,
                    sent_at: new Date().toISOString(),
                }),
            );
        }
    }

    /**
     * Send stop typing indicator
     */
    sendStopTyping(roomId: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: "stop_typing",
                    room_id: roomId,
                    sent_at: new Date().toISOString(),
                }),
            );
        }
    }

    /**
     * Send read receipt
     */
    sendRead(messageId: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "read", data: { message_id: messageId } }));
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        this.isManualClose = true;
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Reconnect to WebSocket
     */
    reconnect(): Promise<void> {
        this.isManualClose = false;
        this.reconnectAttempts = 0;
        return this.connect(this.listeners);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    /**
     * Register event listeners
     */
    on(listeners: WebSocketEventListener): void {
        this.listeners = { ...this.listeners, ...listeners };
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: WSMessage): void {
        switch (data.type) {
            case "text":
                // Map WS text message to Api Message format
                // In api.ts, WSTextMessage is almost the same as Message but with author_id instead of author object
                // The addMessage store action should handle this or we can convert it here
                this.listeners.onMessage?.({
                    id: data.id || "",
                    room_id: data.room_id,
                    author_id: data.author_id,
                    content: data.content,
                    sent_at: data.sent_at,
                    edited_at: data.edited_at || null,
                    deleted_at: data.deleted_at || null,
                    attachments: data.attachments,
                });
                break;
            case "typing":
                this.listeners.onTyping?.({ author_id: data.author_id, room_id: data.room_id });
                break;
            case "stop_typing":
                this.listeners.onStopTyping?.({ author_id: data.author_id, room_id: data.room_id });
                break;
            case "join":
                this.listeners.onJoin?.({ author_id: data.author_id, room_id: data.room_id });
                break;
            case "leave":
                this.listeners.onLeave?.({ author_id: data.author_id, room_id: data.room_id });
                break;
            case "error":
                this.listeners.onError?.(new Error(data.error));
                break;
            default:
                console.warn("Unhandled message type:", (data as any).type);
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}

/**
 * Singleton WebSocket instance
 */
let wsInstance: WebSocketClient | null = null;

export function getWebSocketClient(url: string): WebSocketClient {
    if (wsInstance) {
        // If it's the same URL, return existing instance
        // But the class doesn't store URL in a public way easily accessible here,
        // and we usually want a fresh connection if the hook calls this.
        // For simplicity, let's just allow the hook to disconnect the old one.
        wsInstance.disconnect();
    }
    wsInstance = new WebSocketClient(url);
    return wsInstance;
}

export function closeWebSocketClient(): void {
    if (wsInstance) {
        wsInstance.disconnect();
        wsInstance = null;
    }
}
