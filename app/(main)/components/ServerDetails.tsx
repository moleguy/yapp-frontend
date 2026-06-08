"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight, FiMoreVertical } from "react-icons/fi";
import AddRoomPopup from "@/app/(main)/components/AddRoomPopup";
import AddFloorPopup from "@/app/(main)/components/AddFloorPopup";
import Image from "next/image";
import {
  Floor,
  Room,
  RoomType,
  getRooms,
  createRoom,
  createFloor,
  moveRoom,
  updateRoom,
  deleteRoom,
  deleteFloor,
} from "@/lib/api";

type ServerDetailsProps = {
  activeServer: { id: string; name: string; icon_thumbnail_url?: string | null };
  onSelectChannel?: (room: Room) => void;
  showCategoryPopup?: boolean;
  onCloseCategoryPopup?: () => void;
  onOpenCategoryPopup?: () => void;
  showChannels?: boolean;
  showRoomPopup?: boolean;
  onCloseRoomPopup?: () => void;
  onOpenRoomPopup?: () => void;
};

export default function ServerDetails({
  activeServer,
  onSelectChannel,
  showCategoryPopup,
  onCloseCategoryPopup,
  showRoomPopup,
  onCloseRoomPopup,
}: ServerDetailsProps) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [topLevelRooms, setTopLevelRooms] = useState<Room[]>([]);
  const [openFloors, setOpenFloors] = useState<string[]>([]);
  const [popupFloorId, setPopupFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<
    { type: "room"; room: Room; floorId: string | null } | { type: "floor"; floor: Floor } | null
  >(null);

  const dragItem = useRef<{ room: Room; fromFloorId: string | null } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ floorId: string | null; index: number } | null>(null);

  const loadRooms = useCallback(async () => {
    if (!activeServer?.id) return;
    const data = await getRooms(activeServer.id);
    if (!data) return;
    setTopLevelRooms(data.top_level);
    setFloors(data.floors);
    const map: Record<string, Room[]> = {};
    data.floors.forEach((f) => (map[f.id] = f.rooms));
    setRoomsByFloor(map);
    setOpenFloors(data.floors.map((f) => f.id));
  }, [activeServer?.id]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const getAfterId = (floorId: string | null, index: number): string | null => {
    const list = floorId === null ? topLevelRooms : roomsByFloor[floorId] || [];
    if (index <= 0) return null;
    return list[index - 1]?.id ?? null;
  };

  const handleDrop = async (targetFloorId: string | null, targetIndex: number) => {
    if (!dragItem.current || !activeServer?.id) return;
    const { room, fromFloorId } = dragItem.current;
    const afterId = getAfterId(targetFloorId, targetIndex);

    const prevTop = [...topLevelRooms];
    const prevByFloor = { ...roomsByFloor };

    if (fromFloorId === null) {
      setTopLevelRooms((prev) => prev.filter((r) => r.id !== room.id));
    } else {
      setRoomsByFloor((prev) => ({
        ...prev,
        [fromFloorId]: prev[fromFloorId].filter((r) => r.id !== room.id),
      }));
    }

    if (targetFloorId === null) {
      setTopLevelRooms((prev) => {
        const result = [...prev.filter((r) => r.id !== room.id)];
        result.splice(targetIndex, 0, room);
        return result;
      });
    } else {
      setRoomsByFloor((prev) => {
        const result = [...(prev[targetFloorId] || []).filter((r) => r.id !== room.id)];
        result.splice(targetIndex, 0, room);
        return { ...prev, [targetFloorId]: result };
      });
      if (!openFloors.includes(targetFloorId)) {
        setOpenFloors((prev) => [...prev, targetFloorId]);
      }
    }

    setDropTarget(null);
    dragItem.current = null;

    const moved = await moveRoom(activeServer.id, room.id, {
      hall_id: activeServer.id,
      new_floor_id: targetFloorId,
      after_id: afterId,
    });

    if (!moved) {
      setTopLevelRooms(prevTop);
      setRoomsByFloor(prevByFloor);
    } else {
      await loadRooms();
    }
  };

  const handleRenameRoom = async (room: Room) => {
    const name = window.prompt("Rename room", room.name);
    if (!name?.trim() || name === room.name) return;
    const updated = await updateRoom(activeServer.id, room.id, { name: name.trim() });
    if (updated) await loadRooms();
    setContextMenu(null);
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Delete room "${room.name}"?`)) return;
    const ok = await deleteRoom(activeServer.id, room.id);
    if (ok) await loadRooms();
    setContextMenu(null);
  };

  const handleDeleteFloor = async (floor: Floor) => {
    if (!window.confirm(`Delete floor "${floor.name}" and its rooms?`)) return;
    const ok = await deleteFloor(activeServer.id, floor.id);
    if (ok) await loadRooms();
    setContextMenu(null);
  };

  const renderRoom = (room: Room, floorId: string | null, index: number) => {
    const isTarget = dropTarget?.floorId === floorId && dropTarget.index === index;

    return (
      <div
        key={room.id}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget({ floorId, index });
        }}
        onDrop={() => handleDrop(floorId, index)}
        className="px-2"
      >
        <div
          className={`transition-all duration-150 ${
            isTarget ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mb-1" : "h-0"
          }`}
        />
        <div
          draggable
          onDragStart={(e) => {
            dragItem.current = { room, fromFloorId: floorId };
            const img = new window.Image();
            img.src =
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            e.dataTransfer.setDragImage(img, 0, 0);
          }}
          onDragEnd={() => setDropTarget(null)}
          className={`channel-item flex items-center gap-3 p-2 px-3 rounded-lg cursor-pointer group
          ${
            selectedRoomId === room.id
              ? "bg-[#dddde0] text-[#222831]"
              : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"
          }`}
          onClick={() => {
            setSelectedRoomId(room.id);
            if (room.room_type === "text") onSelectChannel?.(room);
          }}
        >
          {room.room_type === "text" ? (
            <FaHashtag className="w-5 h-5" />
          ) : (
            <HiSpeakerWave className="w-5 h-5" />
          )}
          <span className="flex-1">{room.name}</span>
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-1"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ type: "room", room, floorId });
            }}
          >
            <FiMoreVertical size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (!activeServer) return null;

  return (
    <div className="h-full w-full py-4 flex flex-col">
      <div className="border-b border-[#dcd9d3] pb-4 px-4">
        <div className="flex items-center gap-2">
          {activeServer.icon_thumbnail_url ? (
            <Image
              src={activeServer.icon_thumbnail_url}
              alt=""
              width={40}
              height={40}
              className="rounded-xl"
            />
          ) : (
            <div className="w-10 h-10 bg-[#dcdcdc] rounded-xl flex items-center justify-center">
              {activeServer.name[0]}
            </div>
          )}
          <h2>{activeServer.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-0.5">
          {topLevelRooms.map((room, i) => renderRoom(room, null, i))}
        </div>

        <div
          className={`mx-2 transition-all ${
            dropTarget?.floorId === null && dropTarget.index === topLevelRooms.length
              ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mt-1"
              : "h-2"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget({ floorId: null, index: topLevelRooms.length });
          }}
          onDrop={() => handleDrop(null, topLevelRooms.length)}
        />

        <div className="mt-2 px-2">
          {floors.map((floor) => {
            const rooms = roomsByFloor[floor.id] || [];
            const isOpen = openFloors.includes(floor.id);
            const isDraggingOverCollapsed = dropTarget?.floorId === floor.id && !isOpen;

            return (
              <div
                key={floor.id}
                className="mb-4"
                onDragOver={(e) => {
                  if (!isOpen) {
                    e.preventDefault();
                    setDropTarget({ floorId: floor.id, index: rooms.length });
                  }
                }}
                onDrop={() => {
                  if (!isOpen) handleDrop(floor.id, rooms.length);
                }}
              >
                <div
                  className={`flex items-center justify-between cursor-pointer py-1 px-2 rounded-md transition-colors group ${
                    isDraggingOverCollapsed ? "bg-[#6164f2]/10" : "hover:bg-black/5"
                  }`}
                  onClick={() =>
                    setOpenFloors((prev) =>
                      prev.includes(floor.id)
                        ? prev.filter((f) => f !== floor.id)
                        : [...prev, floor.id]
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <p className="uppercase text-sm font-medium tracking-wide">{floor.name}</p>
                    <FiChevronRight className={isOpen ? "rotate-90" : ""} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({ type: "floor", floor });
                      }}
                    >
                      <FiMoreVertical size={12} />
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:bg-black/10 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopupFloorId(floor.id);
                      }}
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {rooms.map((room, i) => renderRoom(room, floor.id, i))}
                    <div
                      className={`mx-2 transition-all ${
                        dropTarget?.floorId === floor.id && dropTarget.index === rooms.length
                          ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mt-1"
                          : "h-2"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDropTarget({ floorId: floor.id, index: rooms.length });
                      }}
                      onDrop={() => handleDrop(floor.id, rooms.length)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {contextMenu?.type === "room" && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}>
          <div
            className="absolute bg-white border rounded-lg shadow-lg py-1 z-50"
            style={{ top: "40%", left: "50%", transform: "translate(-50%, -50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              onClick={() => handleRenameRoom(contextMenu.room)}
            >
              Rename
            </button>
            <button
              type="button"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleDeleteRoom(contextMenu.room)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {contextMenu?.type === "floor" && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}>
          <div
            className="absolute bg-white border rounded-lg shadow-lg py-1 z-50"
            style={{ top: "40%", left: "50%", transform: "translate(-50%, -50%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
              onClick={() => handleDeleteFloor(contextMenu.floor)}
            >
              Delete Floor
            </button>
          </div>
        </div>
      )}

      <AddFloorPopup
        isOpen={!!showCategoryPopup}
        onClose={() => onCloseCategoryPopup?.()}
        onAddFloor={async (name, isPrivate) => {
          const floor = await createFloor(activeServer.id, {
            hall_id: activeServer.id,
            name,
            is_private: isPrivate,
          });
          if (floor) await loadRooms();
        }}
      />

      {(popupFloorId !== null || showRoomPopup) && (
        <AddRoomPopup
          isOpen
          onClose={() => {
            setPopupFloorId(null);
            onCloseRoomPopup?.();
          }}
          onAddRoom={async (name: string, type: RoomType) => {
            const room = await createRoom(activeServer.id, {
              hall_id: activeServer.id,
              floor_id: popupFloorId,
              name,
              room_type: type,
              is_private: false,
            });
            if (!room) return;
            await loadRooms();
            setPopupFloorId(null);
            onCloseRoomPopup?.();
          }}
        />
      )}
    </div>
  );
}
