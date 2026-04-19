"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight } from "react-icons/fi";
import AddRoomPopup from "@/app/(main)/components/AddRoomPopup";
import Image from "next/image";
import {
  Floor,
  Room,
  RoomType,
  getRooms,
  createRoom,
} from "@/lib/api";

export default function ServerDetails({
  activeServer,
  onSelectChannel,
  showRoomPopup,
  onCloseRoomPopup,
}: any) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [topLevelRooms, setTopLevelRooms] = useState<Room[]>([]);
  const [openFloors, setOpenFloors] = useState<string[]>([]);
  const [popupFloorId, setPopupFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const dragItem = useRef<{ room: Room; fromFloorId: string | null } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ floorId: string | null; index: number } | null>(null);

  useEffect(() => {
    if (!activeServer?.id) return;
    (async () => {
      const data = await getRooms(activeServer.id);
      if (!data) return;
      setTopLevelRooms(data.top_level);
      setFloors(data.floors);
      const map: Record<string, Room[]> = {};
      data.floors.forEach((f) => (map[f.id] = f.rooms));
      setRoomsByFloor(map);
      setOpenFloors(data.floors.map((f) => f.id));
    })();
  }, [activeServer?.id]);

  const handleDrop = (targetFloorId: string | null, targetIndex: number) => {
    if (!dragItem.current) return;
    const { room, fromFloorId } = dragItem.current;

    if (fromFloorId === null) {
      setTopLevelRooms(prev => prev.filter(r => r.id !== room.id));
    } else {
      setRoomsByFloor(prev => ({
        ...prev,
        [fromFloorId]: prev[fromFloorId].filter(r => r.id !== room.id)
      }));
    }

    if (targetFloorId === null) {
      setTopLevelRooms(prev => {
        const result = [...prev.filter(r => r.id !== room.id)];
        result.splice(targetIndex, 0, room);
        return result;
      });
    } else {
      setRoomsByFloor(prev => {
        const result = [...(prev[targetFloorId] || []).filter(r => r.id !== room.id)];
        result.splice(targetIndex, 0, room);
        return { ...prev, [targetFloorId]: result };
      });
      if (!openFloors.includes(targetFloorId!)) {
        setOpenFloors(prev => [...prev, targetFloorId!]);
      }
    }

    setDropTarget(null);
    dragItem.current = null;
  };

  const renderRoom = (room: Room, floorId: string | null, index: number) => {
    const isTarget = dropTarget?.floorId === floorId && dropTarget.index === index;

    return (
      <div
        key={room.id}
        onDragOver={(e) => { e.preventDefault(); setDropTarget({ floorId, index }); }}
        onDrop={() => handleDrop(floorId, index)}
        className="px-2"
      >
        <div className={`transition-all duration-150 ${isTarget ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mb-1" : "h-0"}`} />
        <div
          draggable
          onDragStart={(e) => {
            dragItem.current = { room, fromFloorId: floorId };
            const img = new window.Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);
          }}
          onDragEnd={() => setDropTarget(null)}
          className={`channel-item flex items-center gap-3 p-2 px-3 rounded-lg cursor-pointer
          ${selectedRoomId === room.id ? "bg-[#dddde0] text-[#222831]" : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"}`}
          onClick={() => {
            setSelectedRoomId(room.id);
            if (room.room_type === "text") onSelectChannel?.({ id: room.id, name: room.name });
          }}
        >
          {room.room_type === "text" ? <FaHashtag className="w-5 h-5" /> : <HiSpeakerWave className="w-5 h-5" />}
          <span>{room.name}</span>
        </div>
      </div>
    );
  };

  if (!activeServer) return null;

  return (
    <div className="h-full w-full py-4 flex flex-col">
      {/* HEADER */}
      <div className="border-b border-[#dcd9d3] pb-4 px-4">
        <div className="flex items-center gap-2">
          {activeServer.icon_thumbnail_url ? (
            <Image src={activeServer.icon_thumbnail_url} alt="" width={40} height={40} className="rounded-xl" />
          ) : (
            <div className="w-10 h-10 bg-[#dcdcdc] rounded-xl flex items-center justify-center">{activeServer.name[0]}</div>
          )}
          <h2>{activeServer.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-2">
        {/* TOP LEVEL */}
        <div className="space-y-0.5">
          {topLevelRooms.map((room, i) => renderRoom(room, null, i))}
        </div>

        <div
          className={`mx-2 transition-all ${dropTarget?.floorId === null && dropTarget.index === topLevelRooms.length ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mt-1" : "h-2"}`}
          onDragOver={(e) => { e.preventDefault(); setDropTarget({ floorId: null, index: topLevelRooms.length }); }}
          onDrop={() => handleDrop(null, topLevelRooms.length)}
        />

        {/* FLOORS */}
        <div className="mt-2 px-2">
          {floors.map((floor) => {
            const rooms = roomsByFloor[floor.id] || [];
            const isOpen = openFloors.includes(floor.id);
            const isDraggingOverCollapsed = dropTarget?.floorId === floor.id && !isOpen;

            return (
              <div
                key={floor.id}
                className="mb-4" // Toned down from mb-6 to mb-4
                onDragOver={(e) => {
                  if (!isOpen) { e.preventDefault(); setDropTarget({ floorId: floor.id, index: rooms.length }); }
                }}
                onDrop={() => { if (!isOpen) handleDrop(floor.id, rooms.length); }}
              >
                <div
                  className={`flex items-center justify-between cursor-pointer py-1 px-2 rounded-md transition-colors ${isDraggingOverCollapsed ? "bg-[#6164f2]/10" : "hover:bg-black/5"}`}
                  onClick={() => setOpenFloors(prev => prev.includes(floor.id) ? prev.filter(f => f !== floor.id) : [...prev, floor.id])}
                >
                  <div className="flex items-center gap-2">
                    <p className="uppercase text-sm font-medium tracking-wide">{floor.name}</p>
                    <FiChevronRight className={isOpen ? "rotate-90" : ""} />
                  </div>
                  <button className="p-1 hover:bg-black/10 rounded" onClick={(e) => { e.stopPropagation(); setPopupFloorId(floor.id); }}>
                    <FaPlus size={12} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-1 space-y-0.5">
                    {rooms.map((room, i) => renderRoom(room, floor.id, i))}
                    <div
                      className={`mx-2 transition-all ${dropTarget?.floorId === floor.id && dropTarget.index === rooms.length ? "h-8 border-2 border-dashed border-[#6164f2] rounded-md mt-1" : "h-2"}`}
                      onDragOver={(e) => { e.preventDefault(); setDropTarget({ floorId: floor.id, index: rooms.length }); }}
                      onDrop={() => handleDrop(floor.id, rooms.length)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(popupFloorId !== null || showRoomPopup) && (
        <AddRoomPopup
          isOpen onClose={() => { setPopupFloorId(null); onCloseRoomPopup?.(); }}
          onAddRoom={async (name: string, type: RoomType) => {
            const room = await createRoom(activeServer.id, { hall_id: activeServer.id, floor_id: popupFloorId, name, room_type: type, is_private: false });
            if (!room) return;
            if (popupFloorId) {
              setRoomsByFloor(p => ({ ...p, [popupFloorId]: [...(p[popupFloorId] || []), room] }));
              if (!openFloors.includes(popupFloorId)) setOpenFloors(p => [...p, popupFloorId]);
            } else {
              setTopLevelRooms(p => [...p, room]);
            }
          }}
        />
      )}
    </div>
  );
}