"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight } from "react-icons/fi";
import AddRoomPopup from "@/app/(main)/components/AddRoomPopup";
import Image from "next/image";
import {
  Hall,
  Floor,
  Room,
  RoomType,
  getRooms,
  createFloor,
  createRoom,
  deleteFloor,
  deleteRoom
} from "@/lib/api";

interface ServerDetailsProps {
  activeServer: Hall | null;
  onSelectChannel?: (channel: { id: string; name: string }) => void;
  showCategoryPopup: boolean;
  onCloseCategoryPopup: () => void;
  onOpenCategoryPopup: () => void;
  showChannels: boolean;
}

export default function ServerDetails({
  activeServer,
  onSelectChannel,
  showCategoryPopup,
  onCloseCategoryPopup,
  onOpenCategoryPopup,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showChannels,
}: ServerDetailsProps) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [topLevelRooms, setTopLevelRooms] = useState<Room[]>([]);

  const [openFloors, setOpenFloors] = useState<string[]>([]);
  const [popupFloorId, setPopupFloorId] = useState<string | null>(null);
  const [newFloorName, setNewFloorName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0 });

  const [floorContextMenu, setFloorContextMenu] = useState<{
    x: number;
    y: number;
    floorId: string | null;
  } | null>(null);

  const [roomContextMenu, setRoomContextMenu] = useState<{
    x: number;
    y: number;
    roomId: string | null;
  } | null>(null);

  const channelsAreaRef = useRef<HTMLDivElement | null>(null);
  const categoryPopupRef = useRef<HTMLDivElement | null>(null);
  const deleteFloorMenuRef = useRef<HTMLDivElement | null>(null);
  const roomMenuRef = useRef<HTMLDivElement | null>(null);

  // Fetch floors and rooms when activeServer changes
  useEffect(() => {
    if (!activeServer) {
      setTopLevelRooms([]);
      setFloors([]);
      setRoomsByFloor({});
      return;
    }

    // Immediately clear current data before fetching new hall content
    setTopLevelRooms([]);
    setFloors([]);
    setRoomsByFloor({});

    const fetchContent = async () => {
      const data = await getRooms(activeServer.id);
      if (data) {
        setTopLevelRooms(data.top_level);
        setFloors(data.floors.map(f => ({
          id: f.id,
          hall_id: f.hall_id,
          name: f.name,
          position: f.position,
          is_private: f.is_private,
          created_at: f.created_at,
          updated_at: f.updated_at
        })));

        const roomsMap: Record<string, Room[]> = {};
        data.floors.forEach(f => {
          roomsMap[f.id] = f.rooms;
        });
        setRoomsByFloor(roomsMap);

        // Auto-open all floors by default
        setOpenFloors(data.floors.map(f => f.id));

        // Select first text room if none selected
        if (!selectedRoomId) {
            const firstRoom = data.top_level.find(r => r.room_type === "text") ||
                             data.floors.flatMap(f => f.rooms).find(r => r.room_type === "text");
            if (firstRoom) {
                setSelectedRoomId(firstRoom.id);
                onSelectChannel?.({ id: firstRoom.id, name: firstRoom.name });
            }
        }
      }
    };

    fetchContent();
  }, [activeServer, onSelectChannel, selectedRoomId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) setShowContextMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryPopupRef.current && !categoryPopupRef.current.contains(e.target as Node)) {
        onCloseCategoryPopup();
      }
    }
    if (showCategoryPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryPopup, onCloseCategoryPopup]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (floorContextMenu && deleteFloorMenuRef.current && !deleteFloorMenuRef.current.contains(e.target as Node)) {
        setFloorContextMenu(null);
      }
    }
    if (floorContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [floorContextMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roomContextMenu && roomMenuRef.current && !roomMenuRef.current.contains(e.target as Node)) {
        setRoomContextMenu(null);
      }
    }
    if (roomContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roomContextMenu]);

  const handleDeleteRoom = async () => {
    if (!activeServer || !roomContextMenu?.roomId) return;
    const success = await deleteRoom(activeServer.id, roomContextMenu.roomId);
    if (success) {
      // Refresh local state
      setTopLevelRooms(prev => prev.filter(r => r.id !== roomContextMenu.roomId));
      setRoomsByFloor(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(floorId => {
          next[floorId] = next[floorId].filter(r => r.id !== roomContextMenu.roomId);
        });
        return next;
      });
    }
    setRoomContextMenu(null);
  };

  const handleFloorContextMenu = (e: React.MouseEvent, floorId: string) => {
    e.preventDefault();
    setFloorContextMenu({ x: e.pageX, y: e.pageY, floorId });
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!activeServer) return;
    const success = await deleteFloor(activeServer.id, floorId);
    if (success) {
      setFloors(prev => prev.filter(f => f.id !== floorId));
      setRoomsByFloor(prev => {
          const next = {...prev};
          delete next[floorId];
          return next;
      });
    }
    setFloorContextMenu(null);
  };

  const toggleFloor = (floorId: string) => {
    setOpenFloors(prev =>
      prev.includes(floorId) ? prev.filter(id => id !== floorId) : [...prev, floorId]
    );
  };

  const handleAddRoom = async (name: string, type: RoomType, isPrivate: boolean) => {
    if (!activeServer) return;

    const newRoom = await createRoom(activeServer.id, {
        hall_id: activeServer.id,
        floor_id: popupFloorId,
        name,
        room_type: type,
        is_private: isPrivate
    });

    if (newRoom) {
        if (popupFloorId) {
            setRoomsByFloor(prev => ({
                ...prev,
                [popupFloorId]: [...(prev[popupFloorId] || []), newRoom]
            }));
            if (!openFloors.includes(popupFloorId)) {
                setOpenFloors(prev => [...prev, popupFloorId]);
            }
        } else {
            setTopLevelRooms(prev => [...prev, newRoom]);
        }
    }
    setPopupFloorId(null);
  };

  const handleCreateFloor = async () => {
    if (!activeServer || !newFloorName.trim()) return;

    const floor = await createFloor(activeServer.id, {
        hall_id: activeServer.id,
        name: newFloorName.trim(),
        is_private: false
    });

    if (floor) {
        setFloors(prev => [...prev, floor]);
        setRoomsByFloor(prev => ({ ...prev, [floor.id]: [] }));
        setOpenFloors(prev => [...prev, floor.id]);
    }
    setNewFloorName("");
    onCloseCategoryPopup();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest(".channel-item") ||
        (e.target as HTMLElement).closest(".category-header") ||
        (e.target as HTMLElement).closest(".add-channel-btn")) {
      return;
    }
    setContextMenu({ x: e.pageX, y: e.pageY });
    setShowContextMenu(true);
  };

  if (!activeServer) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center text-[#222831] text-xl font-medium">
        Select or create a Hall to view its details.
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 flex flex-col relative select-none">
      {/* Hall Header */}
      <div className="border-b border-[#dcd9d3] pt-0 pb-4">
        <div className="flex items-center gap-2">
          {activeServer.icon_thumbnail_url ? (
            <Image
              src={activeServer.icon_thumbnail_url}
              alt={activeServer.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#dcdcdc] text-[#1e1e1e] flex items-center justify-center text-xl">
              {activeServer.name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="text-lg font-base text-[#333]">
            {activeServer.name}
          </h2>
        </div>
      </div>

      <div
        ref={channelsAreaRef}
        className="flex-1 min-h-0 overflow-y-auto pr-2 mt-2 relative"
        onContextMenu={handleContextMenu}
      >
        {/* Top Level Rooms */}
        {topLevelRooms.map(room => (
            <div key={room.id}
                 className={`channel-item flex items-center gap-3 p-2 mb-1 rounded-lg cursor-pointer
                            ${selectedRoomId === room.id ? "bg-[#dddde0] text-[#222831]" : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"}`}
                 onClick={() => {
                     setSelectedRoomId(room.id);
                     if (room.room_type === "text") onSelectChannel?.({ id: room.id, name: room.name });
                 }}
                 onContextMenu={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setRoomContextMenu({ x: e.pageX, y: e.pageY, roomId: room.id });
                 }}
            >
                {room.room_type === "text" ? <FaHashtag className="w-5 h-5" /> : <HiSpeakerWave className="w-5 h-5" />}
                <span className="text-base">{room.name}</span>
            </div>
        ))}

        {/* Floors */}
        {floors.map((floor) => {
          const isOpen = openFloors.includes(floor.id);
          const floorRooms = roomsByFloor[floor.id] || [];
          const hasSelectedInFloor = floorRooms.some(r => r.id === selectedRoomId);

          return (
            <div key={floor.id} className="relative mb-3">
              <div
                className="relative flex items-center justify-between category-header cursor-pointer select-none"
                onClick={() => toggleFloor(floor.id)}
                onContextMenu={(e) => handleFloorContextMenu(e, floor.id)}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tracking-wide text-[#222831] uppercase">
                    {floor.name}
                  </p>
                  <FiChevronRight className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPopupFloorId(floor.id);
                  }}
                  className="p-1 rounded-lg hover:bg-[#dcd9d3] add-channel-btn cursor-pointer"
                >
                  <FaPlus className="text-[#555] w-3 h-3" />
                </button>
              </div>

              {(isOpen || hasSelectedInFloor) && (
                <ul className="flex flex-col gap-1 mt-1">
                  {floorRooms.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    if (!isOpen && !isSelected) return null;

                    return (
                      <li
                        key={room.id}
                        className={`channel-item flex items-center gap-3 p-2 rounded-lg cursor-pointer
                                  ${isSelected ? "bg-[#dddde0] text-[#222831]" : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"}`}
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          if (room.room_type === "text") onSelectChannel?.({ id: room.id, name: room.name });
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRoomContextMenu({ x: e.pageX, y: e.pageY, roomId: room.id });
                        }}
                      >
                        {room.room_type === "text" ? <FaHashtag className="w-5 h-5" /> : <HiSpeakerWave className="w-5 h-5" />}
                        <span className="text-base">{room.name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Floor Context Menu */}
      {floorContextMenu && (
        <div
          ref={deleteFloorMenuRef}
          className="flex flex-col items-center gap-1 py-2 px-2 fixed z-100 border rounded-xl border-[#dcd9d3] shadow-xl w-48 bg-[#ffffff] text-[#1e1e1e] text-sm tracking-wide font-base"
          style={{ top: floorContextMenu.y, left: floorContextMenu.x }}
        >
          <button
            onClick={() => handleDeleteFloor(floorContextMenu.floorId!)}
            className="text-left w-full py-2 px-2 font-base cursor-pointer rounded-md text-[#cb3b40] hover:bg-[#fbeff0]"
          >
            Delete Floor
          </button>
        </div>
      )}

      {/* Room Context Menu */}
      {roomContextMenu && (
        <div
          ref={roomMenuRef}
          className="fixed bg-white border shadow rounded-lg border-[#dcd9d3] z-50 py-2 px-2 w-40"
          style={{ top: roomContextMenu.y, left: roomContextMenu.x }}
        >
          <button
            className="block w-full text-left text-[#cb3b40] hover:bg-[#fbeff0] rounded-md cursor-pointer py-2 px-2 text-sm tracking-wide"
            onClick={handleDeleteRoom}
          >
            Delete Room
          </button>
        </div>
      )}

      {/* Add Room Popup */}
      {popupFloorId !== null && (
        <AddRoomPopup
          isOpen={true}
          onClose={() => setPopupFloorId(null)}
          onAddRoom={handleAddRoom}
          floorName={floors.find(f => f.id === popupFloorId)?.name}
        />
      )}

      {/* Main Area Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border shadow rounded-lg border-[#dcd9d3] z-50 py-2 px-2"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full text-left text-[#1e1e1e] hover:bg-[#f2f2f3] rounded-md cursor-pointer py-2 px-2 text-sm tracking-wide"
            onClick={() => {
              setShowContextMenu(false);
              onOpenCategoryPopup();
            }}
          >
            Create Floor
          </button>
        </div>
      )}

      {/* Create Floor Popup */}
      {showCategoryPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div ref={categoryPopupRef} className="bg-white p-6 rounded-lg w-100">
            <h2 className="text-xl text-[#323339] font-medium mb-3 tracking-wide">Create Floor</h2>
            <label className="text-lg text-[#404146] tracking-wide">Floor Name</label>
            <input
              type="text"
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFloor()}
              placeholder="New Floor"
              className="w-full border rounded-lg py-2 px-3 mt-2 mb-4 border-[#cdcccf] focus:outline-none focus:border-[#6164f2]"
              autoFocus
            />
            <div className="flex justify-between gap-2">
              <button onClick={onCloseCategoryPopup} className="px-4 py-2 border rounded-lg bg-[#eeeef0] border-[#dcdce0] cursor-pointer">
                Cancel
              </button>
              <button onClick={handleCreateFloor} className="px-4 py-2 rounded-lg bg-[#6164f2] text-white cursor-pointer hover:bg-[#4c52bd]">
                Create Floor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
