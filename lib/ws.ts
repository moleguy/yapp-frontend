// WebSocket client for real-time messaging

import { Message, Reaction, WSMessage, WSTextMessage, WSTypingMessage, WSReadMessage } from "./api";

export type WebSocketEventListener = {
    onMessage?: (msg: Message) => void;
    onTyping?: (data: { user_id: string; room_id: string }) => void;
    onRead?: (data: { user_id: string; message_id: string }) => void;
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
    sendMessage(content: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "message", data: { content } }));
        } else {
            console.warn("WebSocket not connected, message not sent");
        }
    }

    /**
     * Send typing indicator
     */
    sendTyping(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "typing" }));
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
            case "message":
                this.listeners.onMessage?.((data as WSTextMessage).data);
                break;
            case "typing":
                this.listeners.onTyping?.((data as WSTypingMessage).data);
                break;
            case "read":
                this.listeners.onRead?.((data as WSReadMessage).data);
                break;
            default:
                console.warn("Unknown message type:", data);
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
    if (!wsInstance) {
        wsInstance = new WebSocketClient(url);
    }
    return wsInstance;
}

export function closeWebSocketClient(): void {
    if (wsInstance) {
        wsInstance.disconnect();
        wsInstance = null;
    }
}
