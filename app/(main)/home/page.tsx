'use client';

import { useCallback, useEffect, useState } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { RiUser6Fill } from "react-icons/ri";
// import { IoIosSearch, IoIosClose } from "react-icons/io";
// import { FiPlus } from "react-icons/fi";
import SettingsPopup from "../components/SettingsPopup";
import Image from "next/image";
import ServerList from "../components/ServerList";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import ServerDetails from "@/app/(main)/components/ServerDetails";
import DirectMessages from "../components/DirectMessages";
import { sign } from "crypto";
// import { keyframes } from "motion-dom";

type Server = {
  id: number;
  name: string;
  image?: string;
};

type Friend = {
  id: number;
  name: string;
  status?: string;
};


export default function HomePage() {
  const [showMicrophone, setShowMicrophone] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"server" | "dm" | null>(null);
  // const [friends, setFriends] = useState<Friend[]>([]);

  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username);
  const [displayName, setDisplayName] = useState(user?.displayName);

  const [friends, setFriends] = useState<Friend[]>([
    { id: 1, name: "Alice", status: "online" },
    { id: 2, name: "Bob", status: "offline" },
  ]);

  // const [query, setQuery] = useState("");
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([]);

  const handleServerClick = (server: Server) => {
    setActiveServer(server);
    setActiveView("server");
  };

  const handleLeaveServer = (serverId: number) => {
    // Find the index of the server to be removed
    const serverIndex = servers.findIndex(s => s.id === serverId);

    if (serverIndex !== -1) {
      const newServers = servers.filter(s => s.id !== serverId);
      setServers(newServers);

      if (activeServer?.id === serverId) {
        let nextActiveServer = null;

        if (newServers.length > 0) {
          const nextIndex = serverIndex < newServers.length ? serverIndex : newServers.length - 1;
          nextActiveServer = newServers[nextIndex];
        }
        setActiveServer(nextActiveServer);
      }
    }
  };

  // loading profile from localStorage
  const loadProfile = useCallback(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const parsed = JSON.parse(saved);
      setPreview(parsed.preview || null);
    }
    setDisplayName(user?.displayName);
    setUsername(user?.username);
  }, [user?.username, user?.displayName]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!settingsOpen) {
      loadProfile();
    }
  }, [settingsOpen, loadProfile]);

  const handleDirectMessageClick = () => {
    setActiveServer(null);
    setActiveView("dm");
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-black text-black font-MyFont">
        <div className="w-full flex m-4 bg-[#EAE4D5] rounded-lg">
          {/* Sidebar */}
          <div className="flex flex-col h-full w-[350px] bg-[#f3f3f4] rounded-l-lg">
            {/* Server list */}
            <ServerList
              servers={servers}
              setServers={setServers}
              activeServer={activeServer}
              onServerClick={handleServerClick}
              onLeaveServer={handleLeaveServer}
              onDirectMessagesClick={handleDirectMessageClick}
            />

            {/* Channels → scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto border-t border-b border-[#dcd9d3]">
              {activeView === "server" && activeServer && (
                <ServerDetails activeServer={activeServer} />
              )}
              {activeView === "dm" && (
                <DirectMessages friends={friends} />
              )}
            </div>

            {/* Profile with controls */}
            <div className="flex w-[320px] m-3 py-2 px-2 bg-white border border-[#D4C9BE] rounded-xl select-none items-center justify-between">
              {/* Left: avatar + names */}
              <div className="flex items-center">
                {preview ? (
                  <Image
                    src={preview}
                    alt="Profile"
                    className="w-12 h-12 object-cover rounded"
                    width={48}
                    height={48}
                  />
                ) : (
                  <RiUser6Fill size={32} />
                )}
                <div className="ml-2 font-MyFont text-[#393E46]">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-sm">#{username}</p>
                </div>
              </div>

              {/* Right: mic + settings */}
              <div className="flex items-center gap-2">
                <div
                  className={`cursor-pointer flex justify-center items-center p-2 rounded-lg ${showMicrophone ? "hover:bg-[#dfdfe1]" : "bg-[#ebc8ca] text-[#cb3b40]"
                    }`}
                  onClick={() => setShowMicrophone(!showMicrophone)}
                >
                  {showMicrophone ? (
                    <BiSolidMicrophone size={24} className="text-gray-500 hover:text-[#1e1e1e]" />
                  ) : (
                    <BiSolidMicrophoneOff size={24} />
                  )}
                </div>
                <div className="flex justify-center items-center p-2 rounded-lg hover:bg-[#dfdfe1]">
                  <SettingsPopup
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onOpen={() => setSettingsOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* main section to be edited */}
          <div className="relative flex flex-2 flex-col justify-between bg-white border-r border-gray-300 ">
            <p>iaubsiub</p>
            <div className="flex relative">
              <input className="w-full py-6 pl-18 m-4 focus:outline-none rounded-xl border border-[#dcd9d3]" />
            </div>
          </div>

          <div className="relative flex flex-col w-[400px] bg-white rounded-r-lg p-4 ">
            {/* search and friends who are online and offline */}
          </div>

        </div>
      </div>
    </ProtectedRoute >
  );
}
