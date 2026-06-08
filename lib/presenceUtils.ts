import type { PresenceStatus } from "@/lib/api";

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: "Online",
  away: "Away",
  busy: "Do Not Disturb",
  offline: "Offline",
};

export function presenceTextClass(status?: PresenceStatus): string {
  switch (status) {
    case "online":
      return "text-status-online";
    case "away":
      return "text-yellow-500";
    case "busy":
      return "text-destructive";
    default:
      return "text-subtle";
  }
}

export function presenceBgClass(status?: PresenceStatus): string {
  switch (status) {
    case "online":
      return "bg-status-online";
    case "away":
      return "bg-yellow-500";
    case "busy":
      return "bg-destructive";
    default:
      return "bg-status-offline";
  }
}

export function isPresenceActive(status?: PresenceStatus): boolean {
  return status === "online" || status === "away" || status === "busy";
}

export function toPresenceStatus(raw: string | undefined): PresenceStatus | null {
  if (raw === "online" || raw === "offline" || raw === "away" || raw === "busy") {
    return raw;
  }
  return null;
}

export function resolvePresenceStatus(
  userId: string,
  presenceByUserId: Record<string, PresenceStatus>,
  apiPresence?: { status?: string } | null
): PresenceStatus {
  if (presenceByUserId[userId]) {
    return presenceByUserId[userId];
  }
  return toPresenceStatus(apiPresence?.status) ?? "offline";
}
