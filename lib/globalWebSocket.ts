"use client";

import { getWebSocketUrl, WSMessage, Message } from "./api";
import { WebSocketClient } from "./ws";

interface GlobalWebSocketManager {
  client: WebSocketClient | null;
  isConnected: boolean;
  listeners: Map<string, Set<(message: WSMessage) => void>>;
  connect(): Promise<void>;
  disconnect(): void;
  on(event: string, callback: (message: WSMessage) => void): () => void;
  off(event: string, callback: (message: WSMessage) => void): void;
}

class GlobalWebSocketManagerImpl implements GlobalWebSocketManager {
  public client: WebSocketClient | null = null;
  public isConnected = false;
  public listeners = new Map<string, Set<(message: WSMessage) => void>>();
  public connectionPromise: Promise<void> | null = null;
  private wsInstance: WebSocket | null = null;
  private url: string = '';

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.client?.isConnected()) {
      return Promise.resolve();
    }

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      try {
        // Get JWT token for debugging
        const token = typeof window !== "undefined" ? localStorage.getItem("yapp_access_token") : null;
        console.log("WebSocket connection attempt:", {
          url: this.url,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
          timestamp: new Date().toISOString()
        });

        this.client = new WebSocketClient(getWebSocketUrl());
        
        this.client.connect({
          onMessage: (message: Message) => {
            this.handleMessage(message as WSMessage);
          },
          onEdit: (message: any) => this.handleMessage(message as WSMessage),
          onDelete: (message: any) => this.handleMessage(message as WSMessage),
          onReact: (message: any) => this.handleMessage(message as WSMessage),
          onTyping: (message: any) => this.handleMessage(message as WSMessage),
          onStopTyping: (message: any) => this.handleMessage(message as WSMessage),
          onJoin: (message: any) => this.handleMessage(message as WSMessage),
          onLeave: (message: any) => this.handleMessage(message as WSMessage),
          onError: (error: Error) => {
            console.error("Global WebSocket error:", error);
            console.error("Error details:", {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString()
            });
            
            // Log WebSocket specific information
            if (this.wsInstance) {
              console.error("WebSocket state:", {
                readyState: this.wsInstance.readyState,
                url: this.url,
                protocol: this.wsInstance.protocol,
                extensions: this.wsInstance.extensions
              });
            }
            
            reject(error);
          },
          onOpen: () => {
            console.log("Global WebSocket connected");
            this.isConnected = true;
            // Notify listeners of connection
            const callbacks = this.listeners.get('open');
            if (callbacks) {
              callbacks.forEach(callback => callback({} as WSMessage));
            }
            resolve();
          },
          onClose: () => {
            console.log("Global WebSocket disconnected");
            this.isConnected = false;
            this.connectionPromise = null;
            // Notify listeners of disconnection
            const callbacks = this.listeners.get('close');
            if (callbacks) {
              callbacks.forEach(callback => callback({} as WSMessage));
            }
          },
        }).catch((error) => {
          console.error("Failed to connect global WebSocket:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }

  on(event: string, callback: (message: WSMessage) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  off(event: string, callback: (message: WSMessage) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private handleMessage(message: WSMessage): void {
    const messageType = message.type;
    const callbacks = this.listeners.get(messageType);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }

    // Also call general listeners
    const generalCallbacks = this.listeners.get('*');
    if (generalCallbacks) {
      generalCallbacks.forEach(callback => callback(message));
    }
  }

  send(data: any): void {
    if (this.client?.isConnected()) {
      this.client.sendMessage(data.room_id, data.content);
    }
  }
}

// Singleton instance
export const globalWebSocketManager = new GlobalWebSocketManagerImpl(getWebSocketUrl());

// Initialize connection on module load
if (typeof window !== 'undefined') {
  // Connect after a short delay to ensure page is loaded
  setTimeout(() => {
    globalWebSocketManager.connect().catch(error => {
      console.error("Failed to initialize global WebSocket connection:", error);
    });
  }, 1000);
}
