// WebSocket client for real-time messaging

import { Message, WSMessage, getWebSocketUrl } from "./api";

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

// Event emitter types
type EventCallback = (data: any) => void;

// Global singleton
let globalWsInstance: WebSocketClient | null = null;
let globalConnectionPromise: Promise<void> | null = null;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isManualClose = false;

    // Event emitter: event name -> set of callbacks
    private eventListeners = new Map<string, Set<EventCallback>>();

    constructor(url: string) {
        this.url = url;
    }

    // ========== STATIC GLOBAL MANAGER ==========

    static getGlobalInstance(): WebSocketClient {
        if (!globalWsInstance) {
            globalWsInstance = new WebSocketClient(getWebSocketUrl());
        }
        return globalWsInstance;
    }

    static async ensureGlobalConnection(): Promise<void> {
        if (globalConnectionPromise) return globalConnectionPromise;

        const client = WebSocketClient.getGlobalInstance();
        if (client.isConnected()) return Promise.resolve();

        globalConnectionPromise = client.connect()
            .then(() => { globalConnectionPromise = null; })
            .catch((error) => { globalConnectionPromise = null; throw error; });

        return globalConnectionPromise;
    }

    static closeGlobal(): void {
        if (globalWsInstance) {
            globalWsInstance.disconnect();
            globalWsInstance = null;
        }
        globalConnectionPromise = null;
    }

    // ========== EVENT EMITTER ==========

    /**
     * Subscribe to a named event. Returns an unsubscribe function.
     * Use '*' to subscribe to all message types.
     */
    on(event: string, callback: EventCallback): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);

        return () => {
            const callbacks = this.eventListeners.get(event);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) this.eventListeners.delete(event);
            }
        };
    }

    private emit(event: string, data: any): void {
        // Emit to specific event listeners
        this.eventListeners.get(event)?.forEach((cb) => cb(data));
        // Emit to wildcard listeners
        if (event !== '*') {
            this.eventListeners.get('*')?.forEach((cb) => cb(data));
        }
    }

    // ========== CONNECTION ==========

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                console.log("WebSocket connecting to:", this.url);
                this.ws = new WebSocket(this.url);

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
                    this.emit('open', null);
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
                    this.emit('error', err);
                };

                this.ws.onclose = () => {
                    clearTimeout(timeout);
                    console.log("WebSocket closed");
                    this.emit('close', null);

                    if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        const delay = this.reconnectDelay * this.reconnectAttempts;
                        console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
                        setTimeout(() => this.connect(), delay);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
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
        return this.connect();
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ========== SEND HELPERS ==========

    send(data: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket not connected, message not sent");
        }
    }

    sendMessage(roomId: string, content: string): void {
        this.send({
            type: "text",
            room_id: roomId,
            content,
            sent_at: new Date().toISOString(),
            mention_everyone: false,
            mentions: [],
            attachments: [],
        });
    }

    sendTyping(roomId: string): void {
        this.send({ type: "typing", room_id: roomId, sent_at: new Date().toISOString() });
    }

    sendStopTyping(roomId: string): void {
        this.send({ type: "stop_typing", room_id: roomId, sent_at: new Date().toISOString() });
    }

    sendRead(messageId: string): void {
        this.send({ type: "read", message_id: messageId, sent_at: new Date().toISOString() });
    }

    // ========== MESSAGE HANDLER ==========

    private handleMessage(data: WSMessage): void {
        switch (data.type) {
            case "text":
                this.emit('text', {
                    type: 'text',
                    id: data.id || "",
                    room_id: data.room_id,
                    author_id: data.author_id,
                    content: data.content ?? "",
                    mentions_everyone: data.mentions_everyone ?? false,
                    sent_at: data.sent_at,
                    edited_at: data.edited_at || null,
                    deleted_at: data.deleted_at || null,
                    attachments: data.attachments,
                    mentions: data.mentions || [],
                    created_at: data.created_at || data.sent_at,
                    updated_at: data.updated_at || data.sent_at,
                });
                break;
            case "edit":
                this.emit('edit', data);
                break;
            case "delete":
                this.emit('delete', data);
                break;
            case "react":
                this.emit('react', data);
                break;
            case "typing": {
                // According to API docs, typing events use typing_user field
                const uid = (data as any).typing_user || data.author_id;
                this.emit('typing', { 
                    type: 'typing', 
                    author_id: uid, 
                    room_id: data.room_id,
                    sent_at: data.sent_at 
                });
                break;
            }
            case "stop_typing": {
                const uid = (data as any).typing_user || data.author_id;
                this.emit('stop_typing', { 
                    type: 'stop_typing', 
                    author_id: uid, 
                    room_id: data.room_id,
                    sent_at: data.sent_at 
                });
                break;
            }
            case "read":
                this.emit('read', data);
                break;
            case "presence":
                this.emit('presence', data);
                break;
            case "join":
                this.emit('join', data);
                break;
            case "leave":
                this.emit('leave', data);
                break;
            case "error":
                // Handle server error messages properly
                const errorMessage = (data as any).error || "Unknown WebSocket error";
                console.error("WebSocket server error:", errorMessage, "Room:", data.room_id);
                this.emit('error', new Error(errorMessage));
                break;
            default:
                console.warn("Unhandled message type:", (data as any).type, "Data:", data);
        }
    }
}