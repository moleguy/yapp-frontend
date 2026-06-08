"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight, FiMoreVertical } from "react-icons/fi";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import AddRoomPopup from "@/app/(main)/components/AddRoomPopup";
import AddFloorPopup from "@/app/(main)/components/AddFloorPopup";
import Image from "next/image";
import {
  Floor,
  Hall,
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
import { getLastRoomIdForHall } from "@/lib/hallRoomPersistence";
import { ContextMenu, type ContextMenuItem } from "@/app/(main)/components/ContextMenu";
import { useDialog } from "@/app/contexts/DialogContext";
import { listItemClasses } from "@/lib/listItemClasses";
import { buildHallContextMenuItems } from "@/lib/hallContextMenu";

type HallDetailsProps = {
  activeHall: Hall;
  selectedRoomId?: string | null;
  onSelectRoom?: (room: Room) => void;
  onDeselectRoom?: (hallId: string) => void;
  onToggleRightSidebar?: () => void;
  isRightSidebarCollapsed?: boolean;
  showCategoryPopup?: boolean;
  onCloseCategoryPopup?: () => void;
  onOpenCategoryPopup?: () => void;
  showRoomPopup?: boolean;
  onCloseRoomPopup?: () => void;
  onOpenRoomPopup?: () => void;
  currentUserId?: string;
  onInviteHall: (hall: Hall) => void;
  onLeaveHall: (hallId: string) => void;
};

type RoomContextMenu = { type: "room"; room: Room; floorId: string | null; x: number; y: number };
type FloorContextMenu = { type: "floor"; floor: Floor; x: number; y: number };
type PositionedContextMenu = RoomContextMenu | FloorContextMenu;
type ContextMenuTarget =
  | { type: "room"; room: Room; floorId: string | null }
  | { type: "floor"; floor: Floor };

export default function HallDetails({
  activeHall,
  selectedRoomId: selectedRoomIdProp,
  onSelectRoom,
  onDeselectRoom,
  onToggleRightSidebar,
  isRightSidebarCollapsed = false,
  showCategoryPopup,
  onCloseCategoryPopup,
  onOpenCategoryPopup,
  showRoomPopup,
  onCloseRoomPopup,
  onOpenRoomPopup,
  currentUserId,
  onInviteHall,
  onLeaveHall,
}: HallDetailsProps) {
  const { confirm, prompt } = useDialog();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [topLevelRooms, setTopLevelRooms] = useState<Room[]>([]);
  const [openFloors, setOpenFloors] = useState<string[]>([]);
  const [popupFloorId, setPopupFloorId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<PositionedContextMenu | null>(null);
  const [hallContextMenu, setHallContextMenu] = useState<{ x: number; y: number } | null>(null);

  const dragItem = useRef<{ room: Room; fromFloorId: string | null } | null>(null);
  const roomsRequestRef = useRef(0);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ floorId: string | null; index: number } | null>(null);
  const onSelectRoomRef = useRef(onSelectRoom);
  const menuRef = useRef<HTMLDivElement>(null);
  const hallMenuRef = useRef<HTMLDivElement>(null);
  const hallHeaderRef = useRef<HTMLDivElement>(null);
  const optionsTriggerRef = useRef<HTMLElement | null>(null);

  onSelectRoomRef.current = onSelectRoom;

  const loadRooms = useCallback(async () => {
    const hallId = activeHall?.id;
    if (!hallId) return;

    const requestId = ++roomsRequestRef.current;
    setRoomsLoading(true);

    try {
      const data = await getRooms(hallId);
      if (requestId !== roomsRequestRef.current) return;
      if (!data) return;

      setTopLevelRooms(data.top_level);
      setFloors(data.floors);
      const map: Record<string, Room[]> = {};
      data.floors.forEach((f) => (map[f.id] = f.rooms));
      setRoomsByFloor(map);
      setOpenFloors(data.floors.map((f) => f.id));

      const savedRoomId = getLastRoomIdForHall(hallId);
      if (!savedRoomId) return;

      const allRooms = [
        ...data.top_level,
        ...data.floors.flatMap((f) => f.rooms),
      ];
      const room = allRooms.find(
        (r) => r.id === savedRoomId && r.hall_id === hallId && r.room_type === "text",
      );
      if (room) {
        setSelectedRoomId(room.id);
        onSelectRoomRef.current?.(room);
      }
    } finally {
      if (requestId === roomsRequestRef.current) {
        setRoomsLoading(false);
      }
    }
  }, [activeHall?.id]);

  useEffect(() => {
    setSelectedRoomId(selectedRoomIdProp ?? null);
  }, [selectedRoomIdProp]);

  useEffect(() => {
    roomsRequestRef.current += 1;
    setTopLevelRooms([]);
    setRoomsByFloor({});
    setFloors([]);
    setOpenFloors([]);
    setSelectedRoomId(null);
    setDropTarget(null);
    dragItem.current = null;

    if (!activeHall?.id) {
      setRoomsLoading(false);
      return;
    }

    void loadRooms();
  }, [activeHall?.id, loadRooms]);

  const getAfterId = (floorId: string | null, index: number): string | null => {
    const list = floorId === null ? topLevelRooms : roomsByFloor[floorId] || [];
    if (index <= 0) return null;
    return list[index - 1]?.id ?? null;
  };

  const handleDrop = async (targetFloorId: string | null, targetIndex: number) => {
    if (!dragItem.current || !activeHall?.id) return;
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

    const moved = await moveRoom(activeHall.id, room.id, {
      hall_id: activeHall.id,
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
    setContextMenu(null);
    const name = await prompt({
      title: "Rename room",
      defaultValue: room.name,
    });
    if (!name?.trim() || name === room.name) return;
    const updated = await updateRoom(activeHall.id, room.id, { name: name.trim() });
    if (updated) await loadRooms();
  };

  const handleDeleteRoom = async (room: Room) => {
    setContextMenu(null);
    if (!(await confirm({ message: `Delete room "${room.name}"?`, destructive: true }))) return;
    const ok = await deleteRoom(activeHall.id, room.id);
    if (ok) await loadRooms();
  };

  const handleDeleteFloor = async (floor: Floor) => {
    setContextMenu(null);
    if (!(await confirm({ message: `Delete floor "${floor.name}" and its rooms?`, destructive: true }))) return;
    const ok = await deleteFloor(activeHall.id, floor.id);
    if (ok) await loadRooms();
  };

  const openContextMenu = (
    e: React.MouseEvent,
    menu: ContextMenuTarget,
    anchor: "pointer" | "button" = "pointer",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 192;
    let x: number;
    let y: number;

    if (anchor === "button") {
      optionsTriggerRef.current = e.currentTarget as HTMLElement;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = Math.min(rect.left, window.innerWidth - menuWidth - 8);
      y = rect.bottom + 4;
    } else {
      optionsTriggerRef.current = null;
      x = Math.min(e.clientX, window.innerWidth - menuWidth - 8);
      y = e.clientY;
    }

    setContextMenu((prev) => {
      if (anchor === "button") {
        if (menu.type === "room" && prev?.type === "room" && prev.room.id === menu.room.id) {
          return null;
        }
        if (menu.type === "floor" && prev?.type === "floor" && prev.floor.id === menu.floor.id) {
          return null;
        }
      }
      if (menu.type === "room") {
        return { type: "room", room: menu.room, floorId: menu.floorId, x, y };
      }
      return { type: "floor", floor: menu.floor, x, y };
    });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (optionsTriggerRef.current?.contains(target)) return;
      setContextMenu(null);
      optionsTriggerRef.current = null;
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [contextMenu]);

  useEffect(() => {
    if (!hallContextMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (hallMenuRef.current?.contains(target)) return;
      if (hallHeaderRef.current?.contains(target)) return;
      setHallContextMenu(null);
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [hallContextMenu]);

  const toggleHallContextMenu = () => {
    if (hallContextMenu) {
      setHallContextMenu(null);
      return;
    }
    const el = hallHeaderRef.current;
    if (!el) return;
    setContextMenu(null);
    optionsTriggerRef.current = null;
    const rect = el.getBoundingClientRect();
    setHallContextMenu({ x: rect.left, y: rect.bottom + 4 });
  };

  const hallContextMenuItems = buildHallContextMenuItems({
    hallId: activeHall.id,
    hall: activeHall,
    currentUserId,
    onInvite: () => onInviteHall(activeHall),
    onCreateFloor: () => onOpenCategoryPopup?.(),
    onCreateRoom: () => onOpenRoomPopup?.(),
    onLeaveHall,
    onClose: () => setHallContextMenu(null),
  });

  const roomContextMenuItems: ContextMenuItem[] =
    contextMenu?.type === "room"
      ? [
          { label: "Rename", onClick: () => handleRenameRoom(contextMenu.room) },
          { label: "Delete", danger: true, onClick: () => handleDeleteRoom(contextMenu.room) },
        ]
      : [];

  const floorContextMenuItems: ContextMenuItem[] =
    contextMenu?.type === "floor"
      ? [
          {
            label: "Delete Floor",
            danger: true,
            onClick: () => handleDeleteFloor(contextMenu.floor),
          },
        ]
      : [];

  const renderRoom = (room: Room, floorId: string | null, index: number) => {
    const isMenuOpen = contextMenu?.type === "room" && contextMenu.room.id === room.id;
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
            isTarget ? "h-8 border-2 border-dashed border-primary rounded-md mb-1" : "h-0"
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
          className={`room-item flex items-center gap-3 p-2 px-3 rounded-lg cursor-pointer group ${listItemClasses(selectedRoomId === room.id)}`}
          onClick={() => {
            if (roomsLoading || room.hall_id !== activeHall.id) return;
            if (selectedRoomId === room.id && room.room_type === "text") {
              setSelectedRoomId(null);
              onDeselectRoom?.(activeHall.id);
              return;
            }
            setSelectedRoomId(room.id);
            if (room.room_type === "text") onSelectRoom?.(room);
          }}
          onContextMenu={(e) => openContextMenu(e, { type: "room", room, floorId })}
        >
          {room.room_type === "text" ? (
            <FaHashtag className="w-5 h-5" />
          ) : (
            <HiSpeakerWave className="w-5 h-5" />
          )}
          <span className="flex-1">{room.name}</span>
          <button
            type="button"
            className={`p-1 hover:bg-black/10 rounded flex-shrink-0 ${
              isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => openContextMenu(e, { type: "room", room, floorId }, "button")}
          >
            <FiMoreVertical size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (!activeHall) return null;

  return (
    <div className="h-full w-full py-4 flex flex-col">
      <div className="border-b border-default pb-4 px-4">
        <div className="flex items-center gap-2 justify-between">
          <div
            ref={hallHeaderRef}
            role="button"
            tabIndex={0}
            onClick={toggleHallContextMenu}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleHallContextMenu();
              }
            }}
            className="flex items-center gap-2 min-w-0 flex-1 rounded-lg -ml-1 pl-1.5 pr-2 py-1 cursor-pointer transition-colors hover:bg-list-hover active:bg-list-selected"
            aria-label="Hall options"
            aria-haspopup="menu"
            aria-expanded={!!hallContextMenu}
          >
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl">
              {activeHall.icon_url || activeHall.icon_thumbnail_url ? (
                <Image
                  src={activeHall.icon_url || activeHall.icon_thumbnail_url || ""}
                  alt={`${activeHall.name} hall profile picture`}
                  fill
                  sizes="40px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-placeholder font-medium text-heading">
                  {activeHall.name[0]}
                </div>
              )}
            </div>
            <h2 className="truncate">{activeHall.name}</h2>
          </div>
          {onToggleRightSidebar && (
            <button
              type="button"
              onClick={onToggleRightSidebar}
              className="p-1.5 rounded-lg text-list-muted hover:bg-list-hover hover:text-list-emphasis flex-shrink-0 transition-colors"
              title={isRightSidebarCollapsed ? "Show members panel" : "Hide members panel"}
              aria-expanded={!isRightSidebarCollapsed}
              aria-label={isRightSidebarCollapsed ? "Show members panel" : "Hide members panel"}
            >
              {isRightSidebarCollapsed ? (
                <PanelRightOpen className="w-5 h-5" strokeWidth={2} />
              ) : (
                <PanelRightClose className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto mt-2 ${roomsLoading ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={roomsLoading}
      >
        <div className="space-y-0.5">
          {topLevelRooms.map((room, i) => renderRoom(room, null, i))}
        </div>

        <div
          className={`mx-2 transition-all ${
            dropTarget?.floorId === null && dropTarget.index === topLevelRooms.length
              ? "h-8 border-2 border-dashed border-primary rounded-md mt-1"
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
                    isDraggingOverCollapsed ? "bg-primary-subtle" : "hover:bg-list-hover"
                  }`}
                  onClick={() =>
                    setOpenFloors((prev) =>
                      prev.includes(floor.id)
                        ? prev.filter((f) => f !== floor.id)
                        : [...prev, floor.id],
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
                        openContextMenu(e, { type: "floor", floor }, "button");
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
                          ? "h-8 border-2 border-dashed border-primary rounded-md mt-1"
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
        <ContextMenu
          ref={menuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          items={roomContextMenuItems}
        />
      )}

      {contextMenu?.type === "floor" && (
        <ContextMenu
          ref={menuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          items={floorContextMenuItems}
        />
      )}

      {hallContextMenu && (
        <ContextMenu
          ref={hallMenuRef}
          x={hallContextMenu.x}
          y={hallContextMenu.y}
          items={hallContextMenuItems}
        />
      )}

      <AddFloorPopup
        isOpen={!!showCategoryPopup}
        onClose={() => onCloseCategoryPopup?.()}
        onAddFloor={async (name, isPrivate) => {
          const floor = await createFloor(activeHall.id, {
            hall_id: activeHall.id,
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
            const room = await createRoom(activeHall.id, {
              hall_id: activeHall.id,
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
