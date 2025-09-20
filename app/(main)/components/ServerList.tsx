'use client';

import React, {useEffect, useRef, useState} from "react";
import {FaPlus} from "react-icons/fa";
import {RiMessage3Fill} from "react-icons/ri";
import {BsGridFill} from "react-icons/bs"; // icon for servers tab
import AddServerPopup from "./AddServerPopup";
import {FaLayerGroup} from "react-icons/fa6";

type Server = {
    id: number;
    name: string;
    image?: string;
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
                                   }: ServerListProps) {
    const [showPopup, setShowPopup] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; serverId: number } | null>(null);
    const [showMorePopup, setShowMorePopup] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const serverPopupRef = useRef<HTMLDivElement | null>(null);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);

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

    const handleCreateServer = (name: string, image?: string) => {
        const newServer: Server = {id: Date.now(), name, image};
        console.log(newServer);

        setServers(prev => [...prev, newServer]);
    onServerClick(newServer); // logic for when opening a server when createing a new one
  };

    const handleJoinServer = () => {
        const newServer: Server = {id: Date.now(), name: 'Joined Server'};
        setServers(prev => [...prev, newServer]);
    onServerClick(newServer); // logic for always opening a server when joining a new one
  };

    // servers to show initially and the extra ones for "more"
    const visibleServers = servers.slice(0, MAX_VISIBLE);
    const extraServers = servers.slice(MAX_VISIBLE);

    return (
        <div className=" flex flex-col items-center select-none w-full p-2">
            {/* Top Toggle Buttons */}
            <div className="flex w-full bg-gray-200 rounded-t-lg">
                <button
                    onClick={onServersToggle}
                    className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out
                        ${activeView === "server"
                            ? "bg-[#f3f3f4] text-black rounded-l-lg"
                            : "hover:bg-gray-300 rounded-tl-lg text-gray-600"
                        }
                    `}
                >
                    <BsGridFill className="w-8 h-8"/>
                </button>

                <button
                    onClick={onDirectMessagesClick}
                    className={`flex-1 p-3 flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out
                        ${activeView === "dm"
                            ? "bg-[#f3f3f4] text-black rounded-r-lg"
                            : "hover:bg-gray-300 rounded-tr-lg text-gray-600"
                        }
                    `}
                >
                    {/* Message icon */}
                    <RiMessage3Fill className="w-8 h-8"/>
                </button>
            </div>

            {/* Server Grid */}
            {/* handling opening server container wen only server tab is clicked otherwise hides UI */}
            {activeView === "server" && (<div className="grid grid-cols-3 gap-8 p-4">
                {/* Add server button */}
                <button
                    onClick={() => setShowPopup(true)}
                    className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-[#6164f2] hover:text-white cursor-pointer"
                >
                    <FaPlus size={24}/>
                </button>

                {/* servers */}
                {visibleServers.map(server => (
                    <div
                        key={server.id}
                        className={`relative w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer `}
                        onClick={() => onServerClick(server)}
                        onContextMenu={e => {
                            e.preventDefault();
                            setContextMenu({x: e.clientX, y: e.clientY, serverId: server.id});
                        }}
                    >
                        <div
                            className={`absolute bottom-[-6px] w-8 h-1 rounded-full bg-[#6164f2] origin-center transition-transform duration-300 ease-out
                            ${activeServer?.id === server.id ? 'scale-x-100' : 'scale-x-0'}`}
                        />

                        {server.image ? (
                            <img src={server.image} alt={server.name} className={`w-16 h-16 border-3 rounded-lg object-cover ${activeServer?.id === server.id ? `border-[#d4c9be]`: `border-none`}`}/>
                        ) : (
                            <div
                                className={`w-16 h-16 border-3 rounded-lg text-black text-xl flex items-center justify-center color-primary-button ${activeServer?.id === server.id ? `border-[#D4C9BE]`: `border-none`}`}>
                                {server.name.trim().charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}

                {/* More button if >7 servers */}
                {extraServers.length > 0 && (
                    <button
                        ref={moreButtonRef}
                        onClick={() => setShowMorePopup(prev => !prev)}
                        className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
                    >
                        <FaLayerGroup className="w-6 h-6 text-[#6164f2]"/>
                    </button>
                )}
            </div>)}

            {/* Context menu for leaving a server */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="fixed z-100 bg-white rounded-lg shadow-lg py-2 px-4 cursor-pointer"
                    style={{top: contextMenu.y, left: contextMenu.x, minWidth: 120}}
                >
                    <button
                        className="text-red-500 w-full text-left cursor-pointer"
                        onClick={() => {
                            onLeaveServer(contextMenu.serverId);
                            setContextMenu(null);
                        }}
                    >
                        Leave Server
                    </button>
                </div>
            )}

            {/* Popup with extra servers */}
            {showMorePopup && (
                <div
                    ref={serverPopupRef}
                    className="absolute top-82 left-70 bg-white border border-[#dcd9d3] shadow-lg rounded-xl p-2 grid grid-cols-3 gap-2 z-50">
                    {extraServers.map(server => (
                        <div
                            key={server.id}
                            className="w-16 h-16 flex items-center justify-center rounded-lg cursor-pointer hover:bg-[#6164f2]"
                            onClick={() => {
                                onServerClick(server);
                                setShowMorePopup(false);
                            }}
                            onContextMenu={e => {
                                e.preventDefault();
                                setContextMenu({x: e.clientX, y: e.clientY, serverId: server.id});
                                // setShowMorePopup(false);
                            }}
                        >
                            {server.image ? (
                                <img src={server.image} alt={server.name}
                                     className="w-16 h-16 rounded-lg object-cover"/>
                            ) : (
                                <div
                                    className="w-16 h-16 rounded-lg bg-[#6164f2] text-white flex items-center justify-center">
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
