"use client";

import React, { useState, useRef, useEffect } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import { RiUser6Fill } from "react-icons/ri";
import SettingsPopup from "../components/SettingsPopup";
import Image from "next/image";
import ServerList from "../components/ServerList";
import ProtectedRoute from "../components/ProtectedRoute";
import ServerDetails from "@/app/(main)/components/ServerDetails";
import DirectMessages from "../components/DirectMessages";
import FriendsProfile from "../components/FriendsProfile";
import PollPopup from "@/app/(main)/components/PollPopup";
import ChatArea from "@/app/(main)/components/ChatArea";
import { useAvatar, useUser } from "@/app/store/useUserStore";

type Server = {
  id: number;
  name: string;
  image?: string;
};

type Friend = {
  id: number;
  name: string;
  status?: "online" | "offline";
  mutualFriends?: number;
  username?: string;
  memberSince?: string;
  mutualServers?: number;
};

export default function HomePage() {
  const [showMicrophone, setShowMicrophone] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"server" | "dm" | null>(null);
  const [query, setQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showServersOnly, setShowServersOnly] = useState(false);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [lastActiveServer, setLastActiveServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = useUser();
  const { avatarUrl, fallback, hasAvatar } = useAvatar();

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 1,
      name: "Nischal",
      username: "jasontheween123",
      status: "online",
      mutualFriends: 2,
      memberSince: "2 Jan 2014",
      mutualServers: 3,
    },{
      id: 2,
      name: "Manish",
      username: "manish123",
      status: "offline",
      mutualFriends: 4,
      memberSince: "2 Jan 2018",
      mutualServers: 8,
    },
  ]);

  const handleServerClick = (server: Server) => {
    setActiveServer(server);
    setActiveView("server");
    setLastActiveServer(server);

    // auto selecting the general channel when creating a server
    setSelectedChannel({id: "1", name: "general"});
  };

  // handling leaving a server and showing a server next to it or the server before it
  const handleLeaveServer = (serverId: number) => {
    // Find the index of the server to be removed
    const serverIndex = servers.findIndex((s) => s.id === serverId);

    if (serverIndex !== -1) {
      const newServers = servers.filter((s) => s.id !== serverId);
      setServers(newServers);

      if (activeServer?.id === serverId) {
        let nextActiveServer = null;

        if (newServers.length > 0) {
          const nextIndex =
            serverIndex < newServers.length
              ? serverIndex
              : newServers.length - 1;
          nextActiveServer = newServers[nextIndex];
        }
        setActiveServer(nextActiveServer);
      }
    }
  };

  // handling dm button click
  const handleDirectMessageClick = () => {
    setActiveServer(null);
    setActiveView("dm");
    setShowServersOnly(false);
  };

  // handling server tab click for the last active server
  const handleServersTabClick = () => {
    setActiveView("server");
    setShowServersOnly(true);

    if (lastActiveServer) {
      setActiveServer(lastActiveServer);
    } else if (servers.length > 0) {
      setActiveServer(servers[0]);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-black text-black font-MyFont">
        <div className="relative w-full flex bg-[#EAE4D5] m-1">
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
              onServersToggle={handleServersTabClick}
              activeView={activeView}
            />

            {/* Channels and Friends Section To Be Displayed */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto
              ${activeView === "server" && activeServer ? "border-t border-[#dcd9d3]" : ""}
              `}
            >
              {showServersOnly && activeView === "server" && activeServer ? (
                <ServerDetails
                  activeServer={activeServer}
                  onSelectChannel={setSelectedChannel}
                />
              ) : activeView === "dm" ? (
                <DirectMessages
                  friends={friends}
                  onSelectFriend={setSelectedFriend}
                />
              ) : null}
            </div>

            {/* Profile with controls */}
            <div className="flex w-[320px] m-3 py-2 px-2 bg-white border border-[#D4C9BE] rounded-xl select-none items-center justify-between">
              {/* Left: avatar + names */}
              <div className="flex items-center">
                {hasAvatar ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    className="w-12 h-12 object-cover rounded-full"
                    width={48}
                    height={48}
                    onError={() => {
                      console.error("Avatar image failed to load:", avatarUrl); // REMOVE IN PROD
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                    {fallback}
                  </div>
                )}
                <div className="ml-2 font-MyFont text-[#393E46]">
                  <p className="text-sm font-medium">
                    {user?.display_name || "No Name"}
                  </p>
                  <p className="text-sm">@{user?.username || "no-username"}</p>
                </div>
              </div>

              {/* Right: mic + settings */}
              <div className="flex items-center gap-2">
                <div
                  className={`cursor-pointer flex justify-center items-center p-2 rounded-lg ${
                    showMicrophone
                      ? "hover:bg-[#dfdfe1] hover:text-[#1e1e1e]"
                      : "bg-[#ebc8ca] text-[#cb3b40]"
                  }
                    `}
                  onClick={() => setShowMicrophone(!showMicrophone)}
                >
                  {showMicrophone ? (
                    <button className="cursor-pointer hover:text-[#1e1e1e]">
                      <BiSolidMicrophone size={24} className="text-gray-500" />
                    </button>
                  ) : (
                    <button>
                      <BiSolidMicrophoneOff
                        size={24}
                        className="cursor-pointer"
                      />
                    </button>
                  )}
                </div>

                <div className="flex justify-center items-center p-2 rounded-lg hover:bg-[#dfdfe1] cursor-pointer">
                  <SettingsPopup
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onOpen={() => setSettingsOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-2 flex-col justify-between bg-[#fbfbfb] border-r border-[#dcd9d3]">
            {/* User's information*/}
            {/*<div>*/}
            {/*  Username: {user?.username}*/}
            {/*  <br />*/}
            {/*  Display name: {user?.display_name}*/}
            {/*  <br />*/}
            {/*  Email: {user?.email}*/}
            {/*  <br />*/}
            {/*  Avatar URL: {user?.avatar_url ? user?.avatar_url : "Not Set"}*/}
            {/*  <br />*/}
            {/*  Active : {user?.active ? "True" : "False"}*/}
            {/*</div>*/}

            {activeView === "server" && activeServer && selectedChannel ? (
                <ChatArea
                    serverName={activeServer.name}
                    channelName={selectedChannel.name}
                    channelId={`server-${activeServer.id}-channel-${selectedChannel.id}`} // Unique ID for each channel
                    isDm={false}
                />
            ) : activeView === "dm" && selectedFriend ? (
                <ChatArea
                    friendDisplayName={selectedFriend.display_name || selectedFriend.name}
                    friendUsername={selectedFriend.username || ""}
                    friendId={selectedFriend.id.toString()}
                    friendAvatar={selectedFriend.avatarUrl}
                    isDm={true}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {activeView === "dm"
                      ? "Select a friend to start chatting"
                      : "Select a channel to start chatting"}
                </div>
            )}
          </div>

          <div className="flex flex-col w-[400px] bg-[#fbfbfb] rounded-r-lg">
            {/* search and friends who are online and offline */}

            {/* Friends Section */}
            <div>
              {!showServersOnly && activeView === "dm" && (
                <FriendsProfile friend={selectedFriend} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
