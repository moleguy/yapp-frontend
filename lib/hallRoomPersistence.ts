const STORAGE_KEY = "lastRoomByHall";

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, string>;
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getLastRoomIdForHall(hallId: string): string | null {
  return readMap()[hallId] ?? null;
}

export function setLastRoomIdForHall(hallId: string, roomId: string): void {
  const map = readMap();
  map[hallId] = roomId;
  writeMap(map);
}

export function clearLastRoomIdForHall(hallId: string): void {
  const map = readMap();
  delete map[hallId];
  writeMap(map);
}
