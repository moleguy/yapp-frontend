'use client';

import React, { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import AddServerPopup from "./AddServerPopup";

type Server = {
  id: number;
  name: string;
  image?: string;
};

const ROW_SIZE = 3;
const ROW_HEIGHT = 80;
const VISIBLE_ROWS = 3;

export default function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serverId: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // load / save
  useEffect(() => {
    const saved = localStorage.getItem("servers");
    if (saved) setServers(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("servers", JSON.stringify(servers));
  }, [servers]);

  // close context menu
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

  // dynamic height
  const containerHeight =
      rows.length <= VISIBLE_ROWS ? visibleRowsCount * ROW_HEIGHT : VISIBLE_ROWS * ROW_HEIGHT;

  return (
      <div className="flex flex-col justify-center items-start select-none w-80 mt-4">
        {/* Add Server Button */}
        <button
            onClick={handleServer}
            className="w-40 h-10 mb-4 flex items-center justify-center bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#b3aa9e] gap-2"
        >
          <p>Add a server</p>
          <FaPlus />
        </button>

        {/* Server Grid */}
        {servers.length > 0 && (
            <div
                ref={containerRef}
                className="w-full rounded-xl border border-[#b6b09f] bg-white overflow-y-auto"
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
                                  className="w-12 h-12 flex items-center justify-center rounded-lg  cursor-pointer"
                                  onContextMenu={e => {
                                    e.preventDefault();
                                    setContextMenu({ x: e.clientX, y: e.clientY, serverId: server.id });
                                  }}
                              >
                                {server.image ? (
                                    <img
                                        src={server.image}
                                        alt={server.name}
                                        className="rounded-lg object-cover w-16 h-16"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-500 text-white flex items-center justify-center text-xl">
                                      {server.name[0]?.toUpperCase() ?? "?"}
                                    </div>
                                )}
                              </div>
                          ) : (
                              <div key={`empty-${rowIndex}-${index}`} className="w-12 h-12" />
                          )
                      )}
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
            <div
                ref={menuRef}
                className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-2 px-4"
                style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
            >
              <button
                  className="text-red-600 hover:underline w-full text-left"
                  onClick={() => {
                    const idToRemove = contextMenu.serverId;
                    setServers(prev => prev.filter(s => s.id !== idToRemove));
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
