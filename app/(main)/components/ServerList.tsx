// ServerList.tsx

'use client';

import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import AddServerPopup from "./AddServerPopup";
// import { IoHelpCircle } from "react-icons/io5";
// import { FaMessage} from "react-icons/fa6";
import { RiMessage3Fill } from "react-icons/ri";
type Server = {
  id: number;
  name: string;
  image?: string;
};

const ROW_SIZE = 3;
const ROW_HEIGHT = 90;
const VISIBLE_ROWS = 3;

interface ServerListProps {
  servers: Server[];
  setServers: React.Dispatch<React.SetStateAction<Server[]>>;
  activeServer: Server | null;
  onServerClick: (server: Server) => void;
  onLeaveServer: (serverId: number) => void;
  onDirectMessagesClick: () => void;
}

export default function ServerList({ servers, setServers, activeServer, onServerClick, onLeaveServer, onDirectMessagesClick }: ServerListProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serverId: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // load / save
  useEffect(() => {
    const saved = localStorage.getItem("servers");
    if (saved) setServers(JSON.parse(saved));
  }, [setServers]);

  useEffect(() => {
    localStorage.setItem("servers", JSON.stringify(servers));
  }, [servers]);

  // clicking outside logic handling for leave server button
  useEffect(() => {
    if (!contextMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [contextMenu]);

  const handleServer = () => setShowPopup(true);
  const handleCreateServer = (name: string, image?: string) => {
    if (servers.length < 999) {
      const newServer: Server = { id: Date.now(), name, image };
      setServers(prev => [...prev, newServer]);
    }
  };
  const handleJoinServer = () => {
    if (servers.length < 999) {
      const newServer: Server = { id: Date.now(), name: 'Joined Server' };
      setServers(prev => [...prev, newServer]);
    }
  };

  const rows: (Server | null)[][] = [];
  for (let i = 0; i < servers.length; i += ROW_SIZE) {
    const row: (Server | null)[] = [];
    for (let j = 0; j < ROW_SIZE; j++) {
      row.push(servers[i + j] ?? null);
    }
    rows.push(row);
  }

  const neededRows = Math.max(1, Math.ceil(servers.length / ROW_SIZE));
  const visibleRowsCount = Math.min(neededRows, VISIBLE_ROWS);
  const rowsToRender = rows.length <= VISIBLE_ROWS ? rows.slice(0, visibleRowsCount) : rows;
  const containerHeight = rows.length <= VISIBLE_ROWS ? visibleRowsCount * ROW_HEIGHT : VISIBLE_ROWS * ROW_HEIGHT;

  return (
      <div className="flex flex-col justify-center items-center select-none w-full">
        <div className={`flex w-full justify-around items-center mt-4`}>
          <div className={`flex justify-center items-center`}>
            <button
                onClick={handleServer}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#6164f2] hover:border-none gap-2 hover:text-white"
            >
              <FaPlus className={`w-6 h-6`}/>
            </button>
          </div>
          
          <div className={`h-full flex justify-center items-center`}>
            <button
                onClick={onDirectMessagesClick}
                className={`flex justify-center items-center w-10 h-10 bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#6164f2] hover:border-none hover:text-white`} >
              <RiMessage3Fill className={`w-8 h-8`}/>
            </button>
          </div>

          

          {/*<div className="flex items-center w-full" role="separator" aria-label="or">*/}
          {/*  <div className="flex-grow h-px bg-gray-400 opacity-35" />*/}
          {/*</div>*/}
          {/*<button*/}
          {/*    className={`flex justify-center items-center w-10 h-10 bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#6164f2] hover:border-none hover:text-white`}*/}
          {/*>*/}
          {/*  <IoHelpCircle className={`w-8 h-8`}/>*/}
          {/*</button>*/}
        </div>
        <div className="flex items-center w-full" role="separator" aria-label="or">
            <div className="flex-grow h-px bg-gray-400 opacity-35" />
          </div>

        {servers.length > 0 && (
            <div
                ref={containerRef}
                className="w-68 rounded-xl mb-4 overflow-y-auto scrollbar-hide"
                style={{
                  height: `${containerHeight}px`,
                  scrollSnapType: rows.length > VISIBLE_ROWS ? "y mandatory" : "none",
                  scrollBehavior: "smooth",
                }}
            >
              <div className="flex flex-col">
                {rowsToRender.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="flex justify-around items-center"
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          scrollSnapAlign: "start",
                        }}
                    >
                      {row.map((server, index) =>
                          server ? (
                              <div
                                  key={server.id}
                                  className="relative w-16 h-16 flex items-center justify-center rounded-xl cursor-pointer hover:bg-[#6164f2]"
                                  onContextMenu={e => {
                                    e.preventDefault();
                                    setContextMenu({ x: e.clientX, y: e.clientY, serverId: server.id });
                                  }}
                                  onClick={() => onServerClick(server)}
                              >
                                <style>
                                  {`
                                    @keyframes bar-center {
                                        0% {
                                          transform: scaleY(0);
                                          opacity: 0;
                                        }
                                        100% {
                                          transform: scaleY(1);
                                          opacity: 1;
                                        }
                                      }
                                      
                                      .animate-bar-center {
                                        animation: bar-center 0.3s ease-out forwards;
                                      }
                                  `}
                                </style>

                                {activeServer?.id === server.id && (
                                    <div
                                        className="absolute left-[-8px] w-1 h-8 rounded-full bg-[#6164f2]
                                        origin-center animate-bar-center"
                                    />
                                )}

                                {server.image ? (
                                    <img
                                        src={server.image}
                                        alt={server.name}
                                        className="rounded-lg object-cover w-16 h-16"
                                    />
                                ) : (
                                    <div className={`w-16 h-16 rounded-lg text-[#eeeffe] bg-[#6164f2] flex items-center justify-center text-xl ${activeServer?.id === server.id ? 'text-white' : ''}`}>
                                      {server.name
                                          .trim()
                                          .split(/\s+/)
                                          .map(word => word[0].toUpperCase())
                                          .join("") ?? '?'
                                      }
                                    </div>
                                )}
                              </div>
                          ) : (
                              <div key={`empty-${rowIndex}-${index}`} className="w-16 h-16" />
                          )
                      )}
                    </div>
                ))}
              </div>
            </div>
        )}

        {contextMenu && (
            <div
                ref={menuRef}
                className="fixed z-50 bg-white rounded-lg shadow-lg py-2 px-4 hover:bg-[#ebc8ca]"
                style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
            >
              <button
                  className="text-[#cb3b40] w-full text-left "
                  onClick={() => {
                    // Call the onLeaveServer prop
                    onLeaveServer(contextMenu.serverId);
                    setContextMenu(null);
                  }}
              >
                Leave Server
              </button>
            </div>
        )}

        <AddServerPopup
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            onCreate={handleCreateServer}
            onJoin={handleJoinServer}
        />
      </div>
  );
}