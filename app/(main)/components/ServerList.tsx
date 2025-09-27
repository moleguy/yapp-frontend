"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RiMessage3Fill } from "react-icons/ri";
import { BsGridFill } from "react-icons/bs"; // icon for servers tab
import AddServerPopup from "./AddServerPopup";
import { FaLayerGroup } from "react-icons/fa6";
import Image from "next/image";
import { useEdgeStore } from "@/lib/edgestore";

type Server = {
  id: number;
  name: string;
  imageString?: string;
};

interface ServerListProps {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  activeServer: Server | null;
  onServerClick: (server: Server) => void;
  onLeaveServer: (serverId: number) => void;
  onDirectMessagesClick: () => void;
  onServersToggle: () => void;
  activeView: "server" | "dm" | null;
  onCreateCategoryClick: (server: Server) => void;
}

const MAX_VISIBLE = 7; // show up to 7 servers before showing "more"

export default function ServerList({
    servers,
    setServers,
    activeServer,
    onServerClick,
    onLeaveServer,
    onDirectMessagesClick,
    onServersToggle,
    activeView,
    onCreateCategoryClick,
}: ServerListProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    serverId: number;
  } | null>(null);
  const [showMorePopup, setShowMorePopup] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const serverPopupRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  const { edgestore } = useEdgeStore();

  // load / save from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("servers");
    if (saved) setServers(JSON.parse(saved));
  }, [setServers]);

  useEffect(() => {
    localStorage.setItem("servers", JSON.stringify(servers));
  }, [servers]);

  useEffect(() => {
    if (!showMorePopup) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        serverPopupRef.current?.contains(target) ||
        moreButtonRef.current?.contains(target)
      ) {
        return; // clicked inside popup or button, ignore
      }
      setShowMorePopup(false);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showMorePopup]);

  // close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [contextMenu]);

  const handleCreateServer = async (name: string, imageString?: string) => {
    const id = String(Date.now());
    const newServer: Server = { id: Date.now(), name, imageString };
    setServers((prev) => [...prev, newServer]);
    onServerClick(newServer); // logic for when opening a server when creating a new one

    // Create new hall - Backend
    let hallIconUrl: string | null = null;
    if (imageString) {
      const hallIcon = base64ToFile(imageString || "", `${id}.png`);
      hallIconUrl = await uploadImage(hallIcon);
    }

    // Create new hall
    try {
      const { createHall } = await import("@/lib/api");
      const newhall = await createHall({
        name: name,
        icon_url: hallIconUrl ?? null,
        banner_color: "#ffffff",
        description: "",
      });
      console.log(newhall);
    } catch (err) {
      console.warn("Failed to create hall:", err); // fix here
      return;
    }
  };

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const res = await edgestore.publicImages.upload({
        file,
        onProgressChange: (progress: number) =>
          console.log("Upload progress:", progress),
      });

      return res.url ?? null;
    } catch (err) {
      console.warn("Failed to upload image (ignored):", err);
      return null;
    }
  }

  function base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  const handleJoinServer = () => {
    const newServer: Server = { id: Date.now(), name: "Joined Server" };
    setServers((prev) => [...prev, newServer]);
    onServerClick(newServer); // logic for always opening a server when joining a new one
  };

  // servers to show initially and the extra ones for "more"
  const visibleServers = servers.slice(0, MAX_VISIBLE);
  const extraServers = servers.slice(MAX_VISIBLE);

  const contextMenuItems = [
    {
      label: "Invite People",
      danger: false,
      onClick: () => {}, // here to add a function to invite people on hall
    },
    {
      label: "Create Category",
      danger: false,
      onClick: () => {
        if (contextMenu) {
          const server = servers.find(s => s.id === contextMenu?.serverId);
          if (server) {
            onCreateCategoryClick(server); // CALL THE PARENT FUNCTION
          }
        }
        setContextMenu(null);
      },
    },
    {
      label: "Leave Hall",
      danger: true,
      onClick: () => {
        if(!contextMenu) return;
        onLeaveServer(contextMenu.serverId);
        setContextMenu(null);
      },
    },
  ];

  return (
    <div className=" flex flex-col items-center select-none w-full ">
      {/* Top Toggle Buttons */}
      <div className="flex w-full bg-[#e6e6e6] rounded-t-lg ">
        <button
          onClick={onServersToggle}
          className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ease-in-out
                                  ${
                                    activeView === "server"
                                      ? "bg-[#f3f3f4] text-black"
                                      : "hover:bg-gray-300 text-gray-600"
                                  }
                              `}
        >
          <BsGridFill className="w-8 h-8" />
        </button>

        <button
          onClick={onDirectMessagesClick}
          className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-150 ease-in-out
                                  ${
                                    activeView === "dm"
                                      ? "bg-[#f3f3f4] text-black"
                                      : "hover:bg-gray-300 text-gray-600"
                                  }
                              `}
        >
          {/* Message icon */}
          <RiMessage3Fill className="w-8 h-8" />
        </button>
      </div>

      {/* Server Grid */}
      {/* handling opening server container wen only server tab is clicked otherwise hides UI */}
      {activeView === "server" && (
        <div className="grid grid-cols-3 gap-8 p-4">
          {/* Add server button */}
          <button
            onClick={() => setShowPopup(true)}
            className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-[#6164f2] hover:text-white cursor-pointer"
          >
            <FaPlus size={24} />
          </button>

          {/* servers */}
          {visibleServers.map((server) => (
            <div
              key={server.id}
              className={`relative w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer `}
              onClick={() => onServerClick(server)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  serverId: server.id,
                });
              }}
            >
              <div
                className={`absolute bottom-[-6px] w-8 h-1 rounded-full bg-[#6164f2] origin-center transition-transform duration-300 ease-out
                            ${activeServer?.id === server.id ? "scale-x-100" : "scale-x-0"}`}
              />

              {server.imageString ? (
                <img
                  src={server.imageString}
                  alt={server.name}
                  className={`w-16 h-16 border-3 rounded-lg object-cover ${activeServer?.id === server.id ? `border-[#d4c9be]` : `border-none`}`}
                />
              ) : (
                <div
                  className={`w-16 h-16 border-3 rounded-lg text-black text-xl flex items-center justify-center color-primary-button ${activeServer?.id === server.id ? `border-[#D4C9BE]` : `border-none`}`}
                >
                  {server.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* More button if >7 servers */}
          {extraServers.length > 0 && (
            <button
              ref={moreButtonRef}
              onClick={() => setShowMorePopup((prev) => !prev)}
              className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
            >
              <FaLayerGroup className="w-6 h-6 text-[#6164f2]" />
            </button>
          )}
        </div>
      )}

      {/* Context menu for leaving a server */}
      {contextMenu && (
          <div
              ref={menuRef}
              className="flex flex-col items-center gap-1 py-2 px-2 fixed z-100 border rounded-xl border-[#dcd9d3] shadow-lg w-48  bg-[#ffffff] cursor-pointer text-[#1e1e1e] text-sm tracking-wide font-base"
              style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
          >
            {contextMenuItems.map((item, idx, arr) => ( // USE THE NEW ARRAY
                <React.Fragment key={item.label}>
                  <button
                      onClick={item.onClick}
                      className={`text-left w-full py-2 px-2 rounded-md font-base cursor-pointer ${
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

      {/* Popup with extra servers */}
      {showMorePopup && (
        <div
          ref={serverPopupRef}
          className="absolute top-78 left-70 bg-white border border-[#dcd9d3] shadow-lg rounded-xl p-2 grid grid-cols-3 gap-2 z-50"
        >
          {extraServers.map((server) => (
            <div
              key={server.id}
              className="w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer"
              onClick={() => {
                onServerClick(server);
                setShowMorePopup(false);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  serverId: server.id,
                });
                // setShowMorePopup(false);
              }}
            >
              {server.imageString ? (
                <Image
                  src={server.imageString}
                  alt={server.name}
                  className={`w-16 h-16 border-3 rounded-lg object-cover ${activeServer?.id === server.id ? `border-[#d4c9be]` : `border-none`}`}
                />
              ) : (
                <div
                  className={`w-16 h-16 border-3 rounded-lg text-black text-xl flex items-center justify-center color-primary-button ${activeServer?.id === server.id ? `border-[#D4C9BE]` : `border-none hover:border-none`}`}
                >
                  {server.name.trim().charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add server popup */}
      <AddServerPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onCreate={handleCreateServer}
        onJoin={handleJoinServer}
      />
    </div>
  );
}
