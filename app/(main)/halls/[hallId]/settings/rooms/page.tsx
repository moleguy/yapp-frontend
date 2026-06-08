"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Floor,
  Room,
  getRooms,
  createFloor,
  createRoom,
  deleteFloor,
  deleteRoom,
  updateRoom,
  moveRoom,
  RoomType,
} from "@/lib/api";
import { useSelectHall, useSelectedHall } from "@/app/store/useHallStore";
import AddFloorPopup from "@/app/(main)/components/AddFloorPopup";
import AddRoomPopup from "@/app/(main)/components/AddRoomPopup";
import { useDialog } from "@/app/contexts/DialogContext";

export default function HallRoomsSettings() {
  const { confirm, prompt } = useDialog();
  const params = useParams();
  const hallId = params.hallId as string;
  const selectHall = useSelectHall();
  const hall = useSelectedHall();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [topLevelRooms, setTopLevelRooms] = useState<Room[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [showFloorPopup, setShowFloorPopup] = useState(false);
  const [showRoomPopup, setShowRoomPopup] = useState(false);
  const [roomFloorId, setRoomFloorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await getRooms(hallId);
    if (!data) return;
    setTopLevelRooms(data.top_level);
    setFloors(data.floors);
    const map: Record<string, Room[]> = {};
    data.floors.forEach((f) => (map[f.id] = f.rooms));
    setRoomsByFloor(map);
  }, [hallId]);

  useEffect(() => {
    if (hallId) selectHall(hallId);
  }, [hallId, selectHall]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteRoom = async (room: Room) => {
    if (!(await confirm({ message: `Delete "${room.name}"?`, destructive: true }))) return;
    if (await deleteRoom(hallId, room.id)) load();
  };

  const handleDeleteFloor = async (floor: Floor) => {
    if (!(await confirm({ message: `Delete floor "${floor.name}"?`, destructive: true }))) return;
    if (await deleteFloor(hallId, floor.id)) load();
  };

  const handleRenameRoom = async (room: Room) => {
    const name = await prompt("Rename room", room.name);
    if (!name?.trim()) return;
    if (await updateRoom(hallId, room.id, { name: name.trim() })) load();
  };

  if (!hall) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFloorPopup(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Create Floor
          </button>
          <button
            type="button"
            onClick={() => {
              setRoomFloorId(null);
              setShowRoomPopup(true);
            }}
            className="px-4 py-2 border border-default rounded-lg text-sm"
          >
            Create Room
          </button>
        </div>
      </div>

      <div className="bg-surface-card border border-default rounded-xl p-4 space-y-4">
        <section>
          <h2 className="text-sm font-semibold uppercase text-list-muted mb-2">Top-level Rooms</h2>
          {topLevelRooms.length === 0 ? (
            <p className="text-sm text-faint">No top-level rooms.</p>
          ) : (
            topLevelRooms.map((room) => (
              <RoomRow
                key={room.id}
                room={room}
                onRename={() => handleRenameRoom(room)}
                onDelete={() => handleDeleteRoom(room)}
              />
            ))
          )}
        </section>

        {floors.map((floor) => (
          <section key={floor.id}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase text-list-muted">{floor.name}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => {
                    setRoomFloorId(floor.id);
                    setShowRoomPopup(true);
                  }}
                >
                  + Room
                </button>
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={() => handleDeleteFloor(floor)}
                >
                  Delete floor
                </button>
              </div>
            </div>
            {(roomsByFloor[floor.id] || []).map((room) => (
              <RoomRow
                key={room.id}
                room={room}
                onRename={() => handleRenameRoom(room)}
                onDelete={() => handleDeleteRoom(room)}
              />
            ))}
          </section>
        ))}
      </div>

      <AddFloorPopup
        isOpen={showFloorPopup}
        onClose={() => setShowFloorPopup(false)}
        onAddFloor={async (name, isPrivate) => {
          await createFloor(hallId, { hall_id: hallId, name, is_private: isPrivate });
          load();
        }}
      />

      <AddRoomPopup
        isOpen={showRoomPopup}
        onClose={() => setShowRoomPopup(false)}
        onAddRoom={async (name: string, type: RoomType) => {
          await createRoom(hallId, {
            hall_id: hallId,
            floor_id: roomFloorId,
            name,
            room_type: type,
            is_private: false,
          });
          load();
        }}
      />
    </div>
  );
}

function RoomRow({
  room,
  onRename,
  onDelete,
}: {
  room: Room;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
      <div>
        <span className="font-medium">#{room.name}</span>
        <span className="text-xs text-faint ml-2">{room.room_type}</span>
      </div>
      <div className="flex gap-3 text-sm">
        <button type="button" onClick={onRename} className="text-primary">
          Rename
        </button>
        <button type="button" onClick={onDelete} className="text-destructive">
          Delete
        </button>
      </div>
    </div>
  );
}
