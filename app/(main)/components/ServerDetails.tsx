"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FiChevronRight } from "react-icons/fi";
import AddChannelPopup from "@/app/(main)/components/AddChannelPopup";
import Image from "next/image";

type Server = {
  id: string;
  name: string;
  icon_url?: string;
  icon_thumbnail_url?: string;
  banner_color?: string;
  description?: string;
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
  showCategoryPopup: boolean;
  onCloseCategoryPopup: () => void;
  onOpenCategoryPopup: () => void;
}

export default function ServerDetails({
  activeServer,
  onSelectChannel,
  showCategoryPopup,
  onCloseCategoryPopup,
  onOpenCategoryPopup,
}: ServerDetailsProps) {
  const [serverCategories, setServerCategories] = useState<
    Record<string, Category[]>
  >({});
  const [openCategories, setOpenCategories] = useState<
    Record<string, string[]>
  >({});
  const [popupCategoryId, setPopupCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
  });
  const [categoryContextMenu, setCategoryContextMenu] = useState<{
    x: number;
    y: number;
    categoryId: string | null;
  } | null>(null);
  const channelsAreaRef = useRef<HTMLDivElement | null>(null);
  const categoryPopupRef = useRef<HTMLDivElement | null>(null);
  const deleteCategoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [channelContextMenu, setChannelContextMenu] = useState<{
    x: number;
    y: number;
    channelId: string | null;
  } | null>(null);

  const channelMenuRef = useRef<HTMLDivElement | null>(null);

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

    const generalChannel = initialCategories
      .flatMap((c) => c.channels)
      .find((ch) => ch.name === "general" && ch.type === "text");

    if (generalChannel) {
      setSelectedChannelId(generalChannel.id);
      onSelectChannel?.({ id: generalChannel.id, name: generalChannel.name });
    }
  }, [activeServer, onSelectChannel]);

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
        onCloseCategoryPopup();
      }
    }

    if (showCategoryPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryPopup, onCloseCategoryPopup]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryContextMenu &&
        deleteCategoryMenuRef.current &&
        !deleteCategoryMenuRef.current.contains(e.target as Node)
      ) {
        setCategoryContextMenu(null);
      }
    }

    if (categoryContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryContextMenu]);

  // logic for click outside for delete channel popup to disappear
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        channelContextMenu &&
        channelMenuRef.current &&
        !channelMenuRef.current.contains(e.target as Node)
      ) {
        setChannelContextMenu(null);
      }
    }

    if (channelContextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [channelContextMenu]);

  // deleting a channel after delete channel button click
  const handleLeaveChannel = () => {
    if (!activeServer || !channelContextMenu) return;

    setServerCategories((prev) => {
      const updatedCategories = (prev[activeServer.id] || []).map((cat) => {
        if (cat.channels.some((ch) => ch.id === channelContextMenu.channelId)) {
          const newChannels = cat.channels.filter(
            (ch) => ch.id !== channelContextMenu.channelId,
          );

          if (
            newChannels.length > 0 &&
            selectedChannelId === channelContextMenu.channelId
          ) {
            setSelectedChannelId(newChannels[0].id);
            const selCh = newChannels[0];
            onSelectChannel?.({ id: selCh.id, name: selCh.name });
          } else if (
            newChannels.length === 0 &&
            selectedChannelId === channelContextMenu.channelId
          ) {
            setSelectedChannelId(null); // no channels left
            onSelectChannel?.({ id: "", name: "" });
          }

          return { ...cat, channels: newChannels };
        }
        return cat;
      });

      return { ...prev, [activeServer.id]: updatedCategories };
    });

    setChannelContextMenu(null);
  };

  // handling contextMenu for deleting category with a popup over the channel when right click happens
  const handleCategoryContextMenu = (
    e: React.MouseEvent,
    categoryId: string,
  ) => {
    e.preventDefault();
    setCategoryContextMenu({ x: e.pageX, y: e.pageY, categoryId });
  };

  // deleting a category when clicking a button: Delete Category
  const handleDeleteCategory = (categoryId: string) => {
    if (!activeServer) return;
    setServerCategories((prev) => {
      const updated = (prev[activeServer.id] || []).filter(
        (c) => c.id !== categoryId,
      );
      return { ...prev, [activeServer.id]: updated };
    });
    setCategoryContextMenu(null);
  };

  // collapsing a specific category with only selected channel opened
  const handleCollapseCategory = (categoryId: string) => {
    if (!activeServer) return;
    setOpenCategories((prev) => {
      const ids = prev[activeServer.id] || [];
      const newIds = ids.filter((id) => id !== categoryId);
      return { ...prev, [activeServer.id]: newIds };
    });
    setCategoryContextMenu(null);
  };

  // collapsing all categories except the one containing the selected channel
  const handleCollapseAllCategories = () => {
    if (!activeServer) return;

    setOpenCategories((prev) => {
      const currentCategories = serverCategories[activeServer.id] || [];

      let categoryWithSelectedChannel: string | null = null;

      if (selectedChannelId) {
        for (const category of currentCategories) {
          if (category.channels.some((ch) => ch.id === selectedChannelId)) {
            categoryWithSelectedChannel = category.id;
            break;
          }
        }
      }
      const newIds: string[] = []; // Empty array = all categories collapsed

      return { ...prev, [activeServer.id]: newIds };
    });

    setCategoryContextMenu(null);
  };

  // if any hall isn't open then default message is shown.
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
    if (!categoryId) return; // if no category id provided, return
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
    // opening the newly created category
    setOpenCategories((prev) => ({
      ...prev,
      [activeServer.id]: [...(prev[activeServer.id] || []), newId],
    }));
    // reseting the category popup to be blank
    setNewCategoryName("");
    onCloseCategoryPopup();
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

    // getting the position relative to the channels area container
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
    });
    setShowContextMenu(true);
  };

  const handleCreateCategoryClick = () => {
    setShowContextMenu(false);
    onOpenCategoryPopup();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateCategory();
    }
  };

  return (
    <div className="h-full w-full p-4 flex flex-col relative select-none">
      {/* server heder */}
      <div className="border-b border-[#dcd9d3] pt-0 pb-4">
        <div className="flex items-center gap-2">
          {activeServer.icon_thumbnail_url ? (
            <Image
              src={activeServer.icon_thumbnail_url}
              alt={activeServer.name}
              width={90}
              height={90}
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

      {/* channels and categories container where it listens for right click for category popup */}
      <div
        ref={channelsAreaRef}
        className="flex-1 min-h-0 overflow-y-auto pr-2 mt-2 relative"
        onContextMenu={handleContextMenu}
      >
        {categories.map((cat) => {
          const selectedInThisCat = cat.channels.find(
            (ch) => ch.id === selectedChannelId,
          );

          const open = isCategoryOpen(cat.id);

          return (
            <div key={cat.id} className="relative mb-3">
              <div
                className="relative flex items-center justify-between category-header cursor-pointer select-none"
                onClick={() => toggleCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(cat.id);
                  }
                }}
                onContextMenu={(e) => handleCategoryContextMenu(e, cat.id)}
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
                    e.stopPropagation();
                    setPopupCategoryId(cat.id);
                  }}
                  className="p-1 rounded-lg hover:bg-[#dcd9d3] add-channel-btn cursor-pointer"
                  aria-label={`Add channel to ${cat.name}`}
                >
                  <FaPlus className="text-[#555]" />
                </button>
              </div>

              <ul
                className={`flex flex-col gap-1 tracking-wide cursor-pointer`}
              >
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
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setChannelContextMenu({
                          x: e.pageX,
                          y: e.pageY,
                          channelId: ch.id,
                        });
                      }}
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
                    onClick={() => {
                      setSelectedChannelId(selectedInThisCat.id);
                      if (selectedInThisCat.type === "text") {
                        onSelectChannel?.({
                          id: selectedInThisCat.id,
                          name: selectedInThisCat.name,
                        });
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setChannelContextMenu({
                        x: e.pageX,
                        y: e.pageY,
                        channelId: selectedInThisCat.id,
                      });
                    }}
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

      {categoryContextMenu && (
        <div
          ref={deleteCategoryMenuRef}
          className="flex flex-col items-center gap-1 py-2 px-2 fixed z-100 border rounded-xl border-[#dcd9d3] shadow-xl w-48  bg-[#ffffff] text-[#1e1e1e] text-sm tracking-wide font-base"
          style={{ top: categoryContextMenu.y, left: categoryContextMenu.x }}
          onClick={() => setCategoryContextMenu(null)}
        >
          {[
            {
              label: "Collapse Category",
              danger: false,
              onClick: () => {
                handleCollapseCategory(categoryContextMenu.categoryId!);
              },
            },
            {
              label: "Collapse All Categories",
              danger: false,
              onClick: handleCollapseAllCategories,
            },
            {
              label: "Delete Category",
              danger: true,
              onClick: () => {
                handleDeleteCategory(categoryContextMenu.categoryId!);
              },
            },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <button
                onClick={item.onClick}
                className={`text-left w-full py-2 px-2 font-base cursor-pointer rounded-md ${
                  item.danger
                    ? "text-[#cb3b40] hover:bg-[#fbeff0]"
                    : "hover:bg-[#f2f2f3]"
                }`}
              >
                {item.label}
              </button>
              {idx < arr.length - 1 && (
                <div className="h-px bg-gray-200 w-full my-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {channelContextMenu && (
        <div
          ref={channelMenuRef}
          className="fixed bg-white border shadow rounded-lg border-[#dcd9d3] z-50 py-2 px-2"
          style={{ top: channelContextMenu.y, left: channelContextMenu.x }}
        >
          <button
            className="block w-full text-left text-[#cb3b40] hover:bg-[#fbeff0]  rounded-md cursor-pointer py-2 px-2 text-sm tracking-wide"
            onClick={handleLeaveChannel}
          >
            Delete Channel
          </button>
        </div>
      )}

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

      {/* updating the context menu rendering section*/}
      {showContextMenu && contextMenu && (
        <div
          className="fixed bg-white border shadow rounded-lg border-[#dcd9d3] z-50 py-2 px-2"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            transform: "translate(0, 0)",
          }}
          onClick={() => setShowContextMenu(false)}
        >
          <button
            className="block w-full text-left text-[#1e1e1e] hover:bg-[#f2f2f3] rounded-md cursor-pointer py-2 px-2 text-sm tracking-wide"
            onClick={handleCreateCategoryClick}
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
                onClick={onCloseCategoryPopup}
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
