"use client";

import { useEffect } from "react";
import { WebSocketClient } from "@/lib/ws";

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    useEffect(() => {
        void WebSocketClient.ensureGlobalConnection().catch((error) => {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.warn("WebSocket unavailable:", message);
        });
    }, []);

    return <>{children}</>;
}
