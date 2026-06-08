"use client";

import { useEffect } from "react";
import { WebSocketClient } from "@/lib/ws";
import type { WSPresenceMessage } from "@/lib/api";
import { toPresenceStatus } from "@/lib/presenceUtils";
import { usePresenceStore } from "@/app/store/usePresenceStore";

export function usePresenceSync(watchedUserIds: string[]) {
  const fetchMyPresence = usePresenceStore((s) => s.fetchMyPresence);
  const fetchPresencesForUsers = usePresenceStore((s) => s.fetchPresencesForUsers);
  const setUserPresence = usePresenceStore((s) => s.setUserPresence);

  useEffect(() => {
    void fetchMyPresence();
  }, [fetchMyPresence]);

  const watchedIdsKey = watchedUserIds.join(",");

  useEffect(() => {
    if (!watchedIdsKey) return;
    void fetchPresencesForUsers(watchedIdsKey.split(","));
  }, [watchedIdsKey, fetchPresencesForUsers]);

  useEffect(() => {
    const handlePresence = (message: WSPresenceMessage) => {
      if (message.type !== "presence") return;
      const userId = message.presence_user_id ?? message.author_id;
      const status = toPresenceStatus(message.presence_status);
      if (!userId || !status) return;
      setUserPresence(userId, status);
    };

    void WebSocketClient.ensureGlobalConnection().catch(() => {
      // Presence still works via REST; WS is optional for live updates.
    });

    const unsubscribe = WebSocketClient.getGlobalInstance().on("presence", handlePresence);
    return unsubscribe;
  }, [setUserPresence]);
}
