'use client';

import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import AddServerPopup from "./AddServerPopup";

type Server = {
  id: number;
  name: string;
  image?: string;
};

const SERVERS_PER_PAGE = 9;
const CONTAINER_WIDTH = 320; // px, should match w-[320px]

export default function ServerList() {
  const [servers, setServers] = useState<Server[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [page, setPage] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serverId: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("servers");
    if (saved) {
      setServers(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("servers", JSON.stringify(servers));
  }, [servers]);

  // Close on outside click — but don't close when clicking inside the menu
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
    if (servers.length < 99) {
      const newServer: Server = { id: Date.now(), name, image };
      setServers(prev => [...prev, newServer]);
    }
  };

  const handleJoinServer = () => {
    if (servers.length < 99) {
      const newServer: Server = { id: Date.now(), name: 'Joined Server' };
      setServers(prev => [...prev, newServer]);
    }
  };

  const totalPages = Math.max(1, Math.ceil(servers.length / SERVERS_PER_PAGE));
  const canGoLeft = page > 0;
  const canGoRight = page < totalPages - 1;

  const pages = Array.from({ length: totalPages }).map((_, pageIndex) => {
    const pageServers = servers.slice(
      pageIndex * SERVERS_PER_PAGE,
      (pageIndex + 1) * SERVERS_PER_PAGE
    );

    return (
      <div
        key={pageIndex}
        className="grid grid-cols-3 gap-2 w-[310px] h-[272px] flex-shrink-0 mt-4"
      >
        {pageServers.map((server) => (
          <div
            key={server.id}
            className="w-20 h-20 flex flex-col items-center justify-center bg-white rounded-lg border-[#b6b09f] cursor-pointer hover:bg-[#6265f4] relative"
            onContextMenu={e => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, serverId: server.id });
            }}
          >
            {server.image ? (
              <img
                src={server.image}
                alt={server.name}
                width={48}
                height={48}
                className="rounded-lg object-cover w-16 h-16"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#b6b09f] flex items-center justify-center text-xl">
                {server.name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        ))}

        {Array.from({ length: SERVERS_PER_PAGE - pageServers.length }).map((_, idx) => (
          <div key={`empty-${pageIndex}-${idx}`} className="w-20 h-20" />
        ))}
      </div>
    );
  });

  return (
    <div className="flex flex-col justify-center items-start select-none w-80 mt-4">
      {/* Add Server Button */}
      <button
        onClick={handleServer}
        className="w-40 h-10 mb-4 flex items-center justify-center bg-white rounded-lg border border-[#b6b09f] cursor-pointer hover:bg-[#b3aa9e] gap-2"
      >
        <p className="">Add a server</p>
        <FaPlus />
      </button>

      <div className="relative w-[320px] flex flex-col items-center">
        {canGoLeft && (
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="absolute left-2 top-3 z-10 bg-transparent"
            aria-label="Previous servers"
          >
            <FaChevronLeft />
          </button>
        )}

        <div
          className="overflow-hidden w-[320px] h-[320px] rounded-xl border border-[#b6b09f] bg-white p-4"
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: `${totalPages * CONTAINER_WIDTH}px`,
              transform: `translateX(-${page * CONTAINER_WIDTH}px)`,
            }}
          >
            {pages}
          </div>
        </div>

        {canGoRight && (
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="absolute right-2 top-3 z-10 bg-transparent"
            aria-label="Next servers"
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      {/* Context Menu for Leave Server */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-2 px-4"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
        >
          <button
            className="text-red-600 hover:underline w-full text-left"
            onClick={e => {
              e.stopPropagation();
              const idToRemove = contextMenu.serverId;

              setServers(prevServers => {
                const updated = prevServers.filter(s => s.id !== idToRemove);
                const newTotalPages = Math.max(1, Math.ceil(updated.length / SERVERS_PER_PAGE));
                if (page >= newTotalPages) {
                  setPage(newTotalPages - 1);
                }
                return updated;
              });

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
