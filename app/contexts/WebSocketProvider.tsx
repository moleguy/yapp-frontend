"use client";

import { useEffect, useState } from "react";
import { WebSocketClient } from "@/lib/ws";

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Initialize WebSocket connection on app load
        const initWebSocket = async () => {
            try {
                console.log("Initializing WebSocket connection...");
                await WebSocketClient.ensureGlobalConnection();
                console.log("WebSocket connection established");
                setIsInitialized(true);
            } catch (error) {
                console.error("Failed to initialize WebSocket:", error);
                setError(error instanceof Error ? error.message : "Unknown error");
                setIsInitialized(true); // Still mark as initialized to prevent retry loops
            }
        };

        initWebSocket();

        // Cleanup on unmount
        return () => {
            // Don't disconnect on unmount to keep connection alive
        };
    }, []);

    if (error) {
        console.error("WebSocket initialization error:", error);
    }

    return <>{children}</>;
}
