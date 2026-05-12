// WebSocket client for real-time messaging

import { Message, WSMessage } from "./api";

export type WebSocketEventListener = {
    onMessage?: (msg: Message) => void;
    onEdit?: (msg: Partial<Message> & { id: string }) => void;
    onDelete?: (data: { id: string }) => void;
    onReact?: (data: { message_id: string; user_id: string; emoji: string; action: "add" | "remove" }) => void;
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
    private reconnectDelay = 1000;
    private isManualClose = false;

    constructor(url: string) {
        this.url = url;
    }

    connect(listeners?: WebSocketEventListener): Promise<void> {
        return new Promise((resolve, reject) => {
            if (listeners) {
                this.listeners = listeners;
            }

            try {
                this.ws = new WebSocket(this.url);

                // Set connection timeout
                const timeout = setTimeout(() => {
                    if (this.ws?.readyState === WebSocket.CONNECTING) {
                        this.ws.close();
                        reject(new Error("WebSocket connection timeout"));
                    }
                }, 10000);

                this.ws.onopen = () => {
                    clearTimeout(timeout);
                    console.log("WebSocket connected");
                    this.reconnectAttempts = 0;
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
                    // Don't reject on error to allow reconnection logic to handle it
                };

                this.ws.onclose = () => {
                    clearTimeout(timeout);
                    console.log("WebSocket closed");
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
     * Send a text message to a specific room
     */
    sendMessage(roomId: string, content: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
                JSON.stringify({
                    type: "text",
                    room_id: roomId,
                    content: content,
                    mention_everyone: false,
                    sent_at: new Date().toISOString(),
                }),
            );
        } else {
            console.warn("WebSocket not connected, message not sent");
        }
    }

    /**
     * Send typing indicator for a specific room
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
     * Send stop typing indicator for a specific room
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
            this.ws.send(
                JSON.stringify({
                    type: "read",
                    message_id: messageId,
                    sent_at: new Date().toISOString(),
                }),
            );
        }
    }

    disconnect(): void {
        this.isManualClose = true;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    reconnect(): Promise<void> {
        this.isManualClose = false;
        this.reconnectAttempts = 0;
        return this.connect(this.listeners);
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    on(listeners: WebSocketEventListener): void {
        this.listeners = { ...this.listeners, ...listeners };
    }

    private handleMessage(data: WSMessage): void {
        switch (data.type) {
            case "text":
                this.listeners.onMessage?.({
                    id: data.id || "",
                    room_id: data.room_id,
                    author_id: data.author_id,
                    content: data.content ?? "",
                    mention_everyone: data.mention_everyone ?? data.mentions_everyone,
                    sent_at: data.sent_at,
                    edited_at: data.edited_at || null,
                    deleted_at: data.deleted_at || null,
                    attachments: data.attachments,
                });
                break;
            case "edit":
                this.listeners.onEdit?.({
                    id: (data as any).id,
                    content: (data as any).content,
                    edited_at: (data as any).edited_at,
                });
                break;
            case "delete":
                this.listeners.onDelete?.({ id: (data as any).id });
                break;
            case "react":
                this.listeners.onReact?.({
                    message_id: (data as any).message_id,
                    user_id: (data as any).user_id,
                    emoji: (data as any).emoji,
                    action: (data as any).action,
                });
                break;
            case "typing": {
                const uid = (data as { typing_user?: string }).typing_user || data.author_id;
                this.listeners.onTyping?.({ author_id: uid, room_id: data.room_id });
                break;
            }
            case "stop_typing": {
                const uid = (data as { typing_user?: string }).typing_user || data.author_id;
                this.listeners.onStopTyping?.({ author_id: uid, room_id: data.room_id });
                break;
            }
            case "presence":
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
}

let wsInstance: WebSocketClient | null = null;

export function getWebSocketClient(url: string): WebSocketClient {
    if (wsInstance) {
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