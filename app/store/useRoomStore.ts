import { create } from "zustand";
import { Room, Floor, getRooms, getFloors } from "@/lib/api";

type RoomState = {
    // Data
    rooms: Room[];
    floors: Floor[];
    selectedRoomId: string | null;
    selectedRoom: Room | null;
    loading: boolean;
    error: string | null;

    // Actions
    fetchRoomsAndFloors: (hallId: string) => Promise<void>;
    selectRoom: (roomId: string) => void;
    setSelectedRoom: (room: Room | null) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomId: string) => void;
    updateRoom: (roomId: string, updates: Partial<Room>) => void;
    setRooms: (rooms: Room[]) => void;
    setFloors: (floors: Floor[]) => void;
    clearRooms: () => void;

    // Helpers
    getRoomsByFloor: (floorId: string) => Room[];
    getFloorById: (floorId: string) => Floor | null;
    getRoomById: (roomId: string) => Room | null;

    // Persistence
    saveHallData: (hallId: string, data: { floors: Floor[], rooms: Room[], selectedRoomId: string | null }) => void;
    getHallData: (hallId: string) => { floors: Floor[], rooms: Room[], selectedRoomId: string | null } | null;
};

export const useRoomStore = create<RoomState>((set, get) => ({
    rooms: [],
    floors: [],
    selectedRoomId: null,
    selectedRoom: null,
    loading: false,
    error: null,

    // ===== Room CRUD =====
    fetchRoomsAndFloors: async (hallId: string) => {
        set({ loading: true, error: null });
        try {
            const [roomsRes, floors] = await Promise.all([
                getRooms(hallId),
                getFloors(hallId),
            ]);

            if (roomsRes && floors) {
                // Flatten all rooms from the response into a single array for the store
                const allRooms = [
                    ...roomsRes.top_level,
                    ...roomsRes.floors.flatMap(f => f.rooms)
                ];
                set({ rooms: allRooms, floors, loading: false });
            } else {
                set({ error: "Failed to fetch rooms or floors", loading: false });
            }
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch rooms and floors",
                loading: false,
            });
        }
    },

    selectRoom: (roomId: string) => {
        const room = get().getRoomById(roomId);
        set({
            selectedRoomId: roomId,
            selectedRoom: room || null,
        });
    },

    setSelectedRoom: (room: Room | null) => {
        set({
            selectedRoom: room,
            selectedRoomId: room?.id || null,
        });
    },

    addRoom: (room: Room) => {
        set((state) => {
            const exists = state.rooms.some((r) => r.id === room.id);
            if (exists) return state;
            return { rooms: [...state.rooms, room] };
        });
    },

    removeRoom: (roomId: string) => {
        set((state) => ({
            rooms: state.rooms.filter((r) => r.id !== roomId),
            selectedRoomId: state.selectedRoomId === roomId ? null : state.selectedRoomId,
            selectedRoom:
                state.selectedRoom?.id === roomId ? null : state.selectedRoom,
        }));
    },

    updateRoom: (roomId: string, updates: Partial<Room>) => {
        set((state) => ({
            rooms: state.rooms.map((r) =>
                r.id === roomId ? { ...r, ...updates } : r,
            ),
            selectedRoom:
                state.selectedRoom?.id === roomId
                    ? { ...state.selectedRoom, ...updates }
                    : state.selectedRoom,
        }));
    },

    setRooms: (rooms: Room[]) => set({ rooms }),
    setFloors: (floors: Floor[]) => set({ floors }),

    clearRooms: () => {
        set({
            rooms: [],
            floors: [],
            selectedRoomId: null,
            selectedRoom: null,
        });
    },

    // ===== Helpers =====
    getRoomsByFloor: (floorId: string) => {
        return get().rooms.filter((r) => r.floor_id === floorId);
    },

    getFloorById: (floorId: string) => {
        return get().floors.find((f) => f.id === floorId) || null;
    },

    getRoomById: (roomId: string) => {
        return get().rooms.find((r) => r.id === roomId) || null;
    },

    // ===== Persistence =====
    saveHallData: (hallId: string, data) => {
        const key = `hall_cache_${hallId}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    getHallData: (hallId: string) => {
        const key = `hall_cache_${hallId}`;
        const cached = localStorage.getItem(key);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Failed to parse hall cache", e);
                return null;
            }
        }
        return null;
    },
}));

// Selectors
export const useRooms = () => useRoomStore((state) => state.rooms);
export const useFloors = () => useRoomStore((state) => state.floors);
export const useSelectedRoomId = () =>
    useRoomStore((state) => state.selectedRoomId);
export const useSelectedRoom = () =>
    useRoomStore((state) => state.selectedRoom);
export const useRoomLoading = () => useRoomStore((state) => state.loading);
export const useRoomError = () => useRoomStore((state) => state.error);
export const useRoomsByFloor = (floorId: string) =>
    useRoomStore((state) => state.getRoomsByFloor(floorId));
export const useGetFloorById = (floorId: string) =>
    useRoomStore((state) => state.getFloorById(floorId));

// Actions
export const useFetchRoomsAndFloors = () =>
    useRoomStore((state) => state.fetchRoomsAndFloors);
export const useSelectRoom = () => useRoomStore((state) => state.selectRoom);
export const useSetSelectedRoom = () =>
    useRoomStore((state) => state.setSelectedRoom);
export const useAddRoom = () => useRoomStore((state) => state.addRoom);
export const useRemoveRoom = () => useRoomStore((state) => state.removeRoom);
export const useUpdateRoom = () => useRoomStore((state) => state.updateRoom);
export const useSetRooms = () => useRoomStore((state) => state.setRooms);
export const useSetFloors = () => useRoomStore((state) => state.setFloors);
export const useClearRooms = () => useRoomStore((state) => state.clearRooms);
