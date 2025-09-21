"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight } from "react-icons/fi";
import AddChannelPopup from "@/app/(main)/components/AddChannelPopup";
import Image from "next/image";

type Server = {
  id: number;
  name: string;
  image?: string;
};

type Channel = {
  id: string;
  name: string;
  type: "text" | "voice";
};

type Category = {
  id: string;
  name: string;
  channels: Channel[];
};

interface ServerDetailsProps {
  activeServer: Server | null;
  onSelectChannel?: (channel: { id: string; name: string }) => void;
}

export default function ServerDetails({
  activeServer,
  onSelectChannel,
}: ServerDetailsProps) {
  const [serverCategories, setServerCategories] = useState<
    Record<number, Category[]>
  >({});
  const [openCategories, setOpenCategories] = useState<
    Record<number, string[]>
  >({});
  const [popupCategoryId, setPopupCategoryId] = useState<string | null>(null);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0 });
  const channelsAreaRef = useRef<HTMLDivElement | null>(null);
  const categoryPopupRef = useRef<HTMLDivElement | null>(null);

  // default categories (used to initialize a server)
  const initialCategories: Category[] = [
    {
      id: "cat1",
      name: "Text Channels",
      channels: [{ id: "1", name: "general", type: "text" }],
    },
    {
      id: "cat2",
      name: "Voice Channels",
      channels: [{ id: "3", name: "voice-chat", type: "voice" }],
    },
  ];

  // setting initial categories which is only once
  useEffect(() => {
    if (!activeServer) return;

    setServerCategories((prev) => {
      if (prev[activeServer.id]) return prev;
      return { ...prev, [activeServer.id]: initialCategories };
    });

    setOpenCategories((prev) => {
      if (prev[activeServer.id]) return prev;
      // default categories are expanded which can be changed when set to [] if preferred collapsed
      return { ...prev, [activeServer.id]: initialCategories.map((c) => c.id) };
    });
  }, [activeServer]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) setShowContextMenu(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryPopupRef.current &&
        !categoryPopupRef.current.contains(e.target as Node)
      ) {
        setShowCategoryPopup(false);
      }
    }

    if (showCategoryPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryPopup]);

  // If any server isn't open then default message is shown.
  if (!activeServer) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center text-[#222831] text-xl font-medium">
        Create a server to view its details.
      </div>
    );
  }

  const categories = serverCategories[activeServer.id] || [];
  const openIds = openCategories[activeServer.id] || [];

  const isCategoryOpen = (catId: string) => openIds.includes(catId);

  // state update where for the expand/collapsed state of category
  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => {
      const ids = prev[activeServer.id] || [];
      const exists = ids.includes(catId);
      const newIds = exists
        ? ids.filter((id) => id !== catId)
        : [...ids, catId];
      return { ...prev, [activeServer.id]: newIds };
    });
  };

  // handling adding a channel to the category and ensures when a channel is added by opening a category if its is collapsed
  const handleAddChannel = (
    categoryId: string | null,
    type: "text" | "voice",
    name: string,
  ) => {
    if (!categoryId) return; // If no category id provided, then return
    setServerCategories((prev) => {
      const updated = [...(prev[activeServer.id] || [])];
      const catIndex = updated.findIndex((c) => c.id === categoryId);
      if (catIndex !== -1) {
        updated[catIndex] = {
          ...updated[catIndex],
          channels: [
            ...updated[catIndex].channels,
            { id: Date.now().toString(), name, type },
          ],
        };
      }
      return { ...prev, [activeServer.id]: updated };
    });

    // ensuring category is opened when a channel is added
    setOpenCategories((prev) => {
      const ids = prev[activeServer.id] || [];
      return {
        ...prev,
        [activeServer.id]: ids.includes(categoryId)
          ? ids
          : [...ids, categoryId],
      };
    });
  };

  //
  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    const newId = Date.now().toString();
    if (!name) return;
    setServerCategories((prev) => ({
      ...prev,
      [activeServer.id]: [
        ...(prev[activeServer.id] || []),
        { id: newId, name, channels: [] },
      ],
    }));
    // open the newly created category
    setOpenCategories((prev) => ({
      ...prev,
      [activeServer.id]: [...(prev[activeServer.id] || []), newId],
    }));
    // resets the category popup to be blank
    setNewCategoryName("");
    setShowCategoryPopup(false);
  };

  // context menu handler: only open when right-click is not on a channel or header
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // ignoring if click happened inside the channel item, category header or add button
    if (
      (e.target as HTMLElement).closest(".channel-item") ||
      (e.target as HTMLElement).closest(".category-header") ||
      (e.target as HTMLElement).closest(".add-channel-btn")
    ) {
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // const handleClick = () =>{
  //     if(showContextMenu) setShowContextMenu(false);
  // }

  const handleCreateCategoryClick = () => {
    setShowContextMenu(false);
    setShowCategoryPopup(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateCategory();
    }
  };

  return (
    <div className="h-full w-full p-4 flex flex-col">
      {/* server heder */}
      <div className="border-b border-[#dcd9d3] pt-0 pb-4">
        <div className="flex items-center gap-2">
          {activeServer.image ? (
            <Image
              src={activeServer.image}
              alt={activeServer.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#dcdcdc] text-[#1e1e1e] flex items-center justify-center text-xl">
              {activeServer.name
                .trim()
                .split(/\s+/)
                .map((word) => word[0].toUpperCase())
                .join("") ?? "?"}
            </div>
          )}
          <h2 className="text-lg font-base text-[#333]">
            {activeServer.name.trim().charAt(0).toUpperCase() +
              activeServer.name.trim().slice(1)}
          </h2>
        </div>
      </div>

      {/* separator */}
      {/*<div className="flex items-center my-2 w-full" role="separator">
        <div className="flex-grow h-px bg-gray-600 opacity-35" />
      </div>*/}

      {/* channels and categories container where it listens for right click for category popup */}
      <div
        ref={channelsAreaRef}
        className="flex0 min-h-0 overflow-y-auto pr-2 mt-2 "
        onContextMenu={handleContextMenu}
      >
        {categories.map((cat) => {
          const selectedInThisCat = cat.channels.find(
            (ch) => ch.id === selectedChannelId,
          );

          const open = isCategoryOpen(cat.id);

          return (
            <div key={cat.id} className="mb-3">
              {/* Category header: clickable area toggles collapse/expand.
                        + button stops propagation so it doesn't toggle */}
              <div
                className="flex items-center justify-between category-header cursor-pointer select-none"
                onClick={() => toggleCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(cat.id);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium tracking-wide text-[#222831]">
                    {cat.name}
                  </p>
                  <FiChevronRight
                    className={`transition-transform ${open ? "rotate-90" : ""}`}
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent header toggle
                    setPopupCategoryId(cat.id);
                  }}
                  className="p-1 rounded-lg hover:bg-[#dcd9d3] add-channel-btn"
                  title="Add channel"
                  aria-label={`Add channel to ${cat.name}`}
                >
                  <FaPlus className="text-[#555]" />
                </button>
              </div>

              <ul className={`flex flex-col gap-1 tracking-wide`}>
                {open ? (
                  // expanded -> show all channels
                  cat.channels.map((ch) => (
                    <li
                      key={ch.id}
                      className={`channel-item flex items-center gap-3 p-2 rounded-lg cursor-pointer
                                            ${selectedChannelId === ch.id ? "bg-[#dddde0] text-[#222831]" : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"}`}
                      onClick={() => {
                        setSelectedChannelId(ch.id);
                        if (ch.type === "text") {
                          onSelectChannel?.({ id: ch.id, name: ch.name });
                        }
                      }}
                      onContextMenu={(ev) => ev.stopPropagation()}
                    >
                      {ch.type === "text" ? (
                        <FaHashtag className={`w-6 h-6`} />
                      ) : (
                        <HiSpeakerWave className={`w-6 h-6`} />
                      )}
                      <span className="text-base">{ch.name}</span>
                    </li>
                  ))
                ) : // collapsed -> show only selected channel (if inside this category), otherwise nothing
                selectedInThisCat ? (
                  <li
                    key={selectedInThisCat.id}
                    className="channel-item flex items-center gap-3 p-2 rounded-lg bg-[#dddde0] text-[#222831]"
                    onContextMenu={(ev) => ev.stopPropagation()}
                  >
                    {selectedInThisCat.type === "text" ? (
                      <FaHashtag className={`w-6 h-6`} />
                    ) : (
                      <HiSpeakerWave className={`w-6 h-6`} />
                    )}
                    <span className="text-base">{selectedInThisCat.name}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      {/* add channel popup for specific or each category  */}
      {popupCategoryId && (
        <AddChannelPopup
          isOpen={!!popupCategoryId}
          onClose={() => setPopupCategoryId(null)}
          onAddChannel={(category, type, name) =>
            handleAddChannel(popupCategoryId, type, name)
          }
          category="text"
        />
      )}

      {showContextMenu && (
        <div
          className="absolute bg-white border rounded-lg z-50 border-[#dcd9d3]"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <button
            onClick={handleCreateCategoryClick}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 hover:rounded-lg"
          >
            Create Category
          </button>
        </div>
      )}

      {/* creating category popup when right click in empty space of channels */}
      {showCategoryPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div ref={categoryPopupRef} className="bg-white p-6 rounded-lg w-100">
            <h2 className="text-xl text-[#323339] font-medium mb-3 tracking-wide">
              Create Category
            </h2>
            <label className={`text-lg text-[#404146] tracking-wide`}>
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onKeyDown={handleKeyDown}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New Category"
              className="w-full border rounded-lg py-2 px-3 mt-2 mb-4 border-[#cdcccf] focus:outline-none focus:border-[#6090eb]"
            />
            <div className="flex justify-between gap-2">
              <button
                onClick={() => setShowCategoryPopup(false)}
                className="px-4 py-2 border rounded-lg bg-[#eeeef0] border-[#dcdce0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 rounded-lg bg-[#6164f2] text-[#FAF7F3] cursor-pointer hover:bg-[#4c52bd]"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
