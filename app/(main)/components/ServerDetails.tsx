'use client';

import React, { useState, useEffect, useRef } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight } from "react-icons/fi";
import AddChannelPopup from "@/app/(main)/components/AddChannelPopup";

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
}

export default function ServerDetails({ activeServer }: ServerDetailsProps) {
  const [serverCategories, setServerCategories] = useState<Record<number, Category[]>>({});
  const [openCategories, setOpenCategories] = useState<Record<number, string[]>>({});
  const [popupCategoryId, setPopupCategoryId] = useState<string | null>(null);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({x: 0, y:0});
  const channelsAreaRef = useRef<HTMLDivElement | null>(null);

  // default categories (used to initialize a server)
    const initialCategories: Category[] = [
        {
            id: "cat1",
            name: "Text Channels",
            channels: [
                { id: "1", name: "general", type: "text" },
                { id: "2", name: "announcements", type: "text" },
            ],
        },
        {
            id: "cat2",
            name: "Voice Channels",
            channels: [
                { id: "3", name: "voice-chat", type: "voice" },
                { id: "4", name: "music-lounge", type: "voice" },
            ],
        },
    ];

  // setting initial categories which is only once
    useEffect(() => {
        if (!activeServer) return;

        setServerCategories(prev => {
            if (prev[activeServer.id]) return prev;
            return { ...prev, [activeServer.id]: initialCategories };
        });

        setOpenCategories(prev => {
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
        setOpenCategories(prev => {
            const ids = prev[activeServer.id] || [];
            const exists = ids.includes(catId);
            const newIds = exists ? ids.filter(id => id !== catId) : [...ids, catId];
            return { ...prev, [activeServer.id]: newIds };
        });
    };

    // handling adding a channel to the category and ensures when a channel is added by opening a category if its is collapsed
    const handleAddChannel = (categoryId: string | null, type: "text" | "voice", name: string) => {
        if (!categoryId) return; // If no category id provided, then return
        setServerCategories(prev => {
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
        setOpenCategories(prev => {
            const ids = prev[activeServer.id] || [];
            return { ...prev, [activeServer.id]: ids.includes(categoryId) ? ids : [...ids, categoryId] };
        });
    };

    // 
    const handleCreateCategory = () => {
        const name = newCategoryName.trim();
        const newId = Date.now().toString();
        if (!name) return;
        setServerCategories(prev => ({
            ...prev,
            [activeServer.id]: [
                ...(prev[activeServer.id] || []),
                { id: newId, name, channels: [] },
             ],
        }));
        // open the newly created category
        setOpenCategories(prev => ({
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
        setContextMenu({x: e.clientX, y: e.clientY});
        setShowContextMenu(true);
    };

    const handleClick = () =>{
        if(showContextMenu) setShowContextMenu(false);
    }

    const handleCreateCategoryClick = () =>{
        setShowContextMenu(false);
        setShowCategoryPopup(true);
    }

    return (
        <div className="h-full w-full p-4 flex flex-col">
            {/* server heder */}
            <div className="flex items-center pb-2 gap-2">
                {activeServer.image ? (
                    <img
                        src={activeServer.image}
                        alt={activeServer.name}
                        className="w-8 h-8 rounded-xl object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#6164f2] text-[#eeeffe] flex items-center justify-center text-xl">
                        {activeServer.name
                            .trim()
                            .split(/\s+/)
                            .map((word) => word[0].toUpperCase())
                            .join("") ?? "?"
                        }
                    </div>
                )}
                <h2 className="text-lg font-base text-[#333]">
                    {activeServer.name.trim().charAt(0).toUpperCase() +
                    activeServer.name.trim().slice(1)}
                </h2>
            </div>

            {/* separaor */}
            <div className="flex items-center my-2 w-full" role="separator">
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
            </div>

            {/* channels and categories container where it listens for right click for category popup */}
            <div
                ref={channelsAreaRef}
                className="flex-1 min-h-0 overflow-y-auto pr-2"
                onContextMenu={handleContextMenu}
            >
                {categories.map((cat) => {
                    const selectedInThisCat = cat.channels.find(ch => ch.id === selectedChannelId);

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
                                    <h3 className="text-lg font-medium tracking-wide text-[#222831]">{cat.name}</h3>
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

                            <ul>
                                {open ? (
                                  // expanded -> show all channels
                                    cat.channels.map((ch) => (
                                        <li
                                            key={ch.id}
                                            className={`channel-item flex items-center gap-3 p-2 rounded-lg cursor-pointer
                                            ${selectedChannelId === ch.id ? "bg-[#e7eefb] text-[#222831]" : "hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"}`}
                                            onClick={() => setSelectedChannelId(ch.id)}
                                            onContextMenu={(ev) => ev.stopPropagation()}
                                        >
                                        {ch.type === "text" ? <FaHashtag /> : <HiSpeakerWave />}
                                        <span className="text-base">{ch.name}</span>
                                        </li>
                                    ))
                                    ) : (
                                    // collapsed -> show only selected channel (if inside this category), otherwise nothing
                                        selectedInThisCat ? (
                                        <li
                                            key={selectedInThisCat.id}
                                            className="channel-item flex items-center gap-3 p-2 rounded-lg bg-[#dcd9d3] text-[#222831]"
                                            onContextMenu={(ev) => ev.stopPropagation()}
                                        >
                                        {selectedInThisCat.type === "text" ? <FaHashtag /> : <HiSpeakerWave />}
                                        <span className="text-base">{selectedInThisCat.name}</span>
                                        </li>
                                    ) : null
                                )}
                            </ul>
                        </div>
                    );
                })}

                {/* Tip area: right-click in empty space (not on channel/header) to create a category */}
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
                    className="absolute bg-white border rounded shadow-md z-50"
                    style={{
                    top: contextMenu.y,
                    left: contextMenu.x,
                    }}
                >
                    <button
                        onClick={handleCreateCategoryClick}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                        Create Category
                    </button>
                </div>
            )}

            {/* creating category popup when right click in empty space of channels */}
            {showCategoryPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                        <h2 className="text-lg font-bold mb-3">Create Category</h2>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Enter category name"
                            className="w-full border rounded p-2 mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowCategoryPopup(false)}
                                className="px-4 py-2 rounded bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCategory}
                                className="px-4 py-2 rounded bg-blue-500 text-white"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
