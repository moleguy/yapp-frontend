"use client";

import React, { useState, useEffect } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import SettingsPopup from "../components/SettingsPopup";
import Image from "next/image";
import ServerList from "../components/ServerList";
import ProtectedRoute from "../components/ProtectedRoute";
import ServerDetails from "@/app/(main)/components/ServerDetails";
import DirectMessages from "../components/DirectMessages";
import FriendsProfile from "../components/FriendsProfile";
import ChatArea from "@/app/(main)/components/ChatArea";
import { useAvatar, useUser } from "@/app/store/useUserStore";
import { Hall, getUserHalls } from "@/lib/api";

type Server = {
  id: string;
  name: string;
  icon_url?: string;
  icon_thumbnail_url?: string;
  banner_color?: string;
  description?: string;
};

type Friend = {
  id: number;
  name: string;
  status?: "online" | "offline";
  mutualFriends?: number;
  username?: string;
  memberSince?: string;
  mutualServers?: number;
  tags?: string;
};

export default function HomePage() {
  const [showMicrophone, setShowMicrophone] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"server" | "dm" | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showServersOnly, setShowServersOnly] = useState(false);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [lastActiveServer, setLastActiveServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryPopupServer, setCategoryPopupServer] = useState<Server | null>(
    null,
  );

  const user = useUser();
  const { avatarThumbnailUrl, fallback, hasAvatar } = useAvatar();

  const [userHalls, setUserHalls] = useState<Hall[] | null>(null);
  const [hallsLoading, setHallsLoading] = useState(true);

  useEffect(() => {
    const fetchUserHalls = async () => {
      try {
        setHallsLoading(true);
        const halls = await getUserHalls();
        setUserHalls(halls);

        // Convert halls to servers format and set them
        if (halls && Array.isArray(halls)) {
          const convertedServers: Server[] = halls.map((hall) => ({
            id: hall.id ?? "",
            name: hall.name ?? "",
            icon_url: hall.icon_url ?? "",
            icon_thumbnail_url: hall.icon_thumbnail_url ?? "",
            banner_color: hall.banner_color ?? "",
            description: hall.description ?? "",
          }));
          setServers(convertedServers);

          // Debug logging
          console.log("Fetched halls:", halls);
          console.log("Converted to servers:", convertedServers);
        }
      } catch (error) {
        console.error("Error fetching user halls:", error);
        setUserHalls(null);
      } finally {
        setHallsLoading(false);
      }
    };

    fetchUserHalls();
  }, []);

  const [friends] = useState<Friend[]>([
    {
      id: 1,
      name: "Nischal",
      username: "jasontheween123",
      status: "online",
      mutualFriends: 2,
      memberSince: "2 Jan 2014",
      mutualServers: 3,
    },
    {
      id: 2,
      name: "Manish",
      username: "manish123",
      status: "offline",
      mutualFriends: 4,
      memberSince: "2 Jan 2018",
      mutualServers: 8,
    },
  ]);

  // Separate online and offline friends
  const onlineFriends = friends.filter((friend) => friend.status === "online");
  const offlineFriends = friends.filter(
    (friend) => friend.status === "offline",
  );

  const handleServerClick = (server: Server) => {
    setActiveServer(server);
    setActiveView("server");
    setLastActiveServer(server);

    // auto selecting the general channel when creating a server
    setSelectedChannel({ id: "1", name: "general" });
  };

  // handling leaving a server and showing a server next to it or the server before it
  const handleLeaveServer = (serverId: string) => {
    // Changed from number to string
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

  const handleCreateCategoryClick = (server: Server) => {
    setCategoryPopupServer(server);
    setShowCategoryPopup(true);
  };

  const handleOpenCategoryPopup = () => {
    if (activeServer) {
      setCategoryPopupServer(activeServer);
      setShowCategoryPopup(true);
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
              onCreateCategoryClick={handleCreateCategoryClick}
              isLoading={hallsLoading} // Pass loading state
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
                  showCategoryPopup={
                    showCategoryPopup &&
                    categoryPopupServer?.id === activeServer.id
                  }
                  onCloseCategoryPopup={() => setShowCategoryPopup(false)}
                  onOpenCategoryPopup={handleOpenCategoryPopup}
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
                    src={avatarThumbnailUrl}
                    alt="Profile"
                    className="w-12 h-12 object-cover rounded-full"
                    width={90}
                    height={90}
                    onError={() => {
                      console.error(
                        "Avatar image failed to load:",
                        avatarThumbnailUrl,
                      ); // REMOVE IN PROD
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
            {/* Show loading state while fetching halls */}
            {hallsLoading && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading your halls...
              </div>
            )}

            {!hallsLoading && (
              <>
                {activeView === "server" && activeServer && selectedChannel ? (
                  <ChatArea
                    serverName={activeServer.name}
                    channelName={selectedChannel.name}
                    channelId={`server-${activeServer.id}-channel-${selectedChannel.id}`} // Unique ID for each channel
                    isDm={false}
                  />
                ) : activeView === "dm" && selectedFriend ? (
                  <ChatArea
                    friendDisplayName={
                      selectedFriend.display_name || selectedFriend.name
                    }
                    friendUsername={selectedFriend.username || ""}
                    friendId={selectedFriend.id.toString()}
                    friendAvatar={selectedFriend.avatarUrl}
                    isDm={true}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    {activeView === "dm"
                      ? "Select a friend to start chatting"
                      : userHalls && userHalls.length === 0
                        ? "No halls found. Create or join a hall to get started!"
                        : "Select a channel to start chatting"}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col w-[400px] bg-[#fbfbfb] rounded-r-lg">
            {/* Friends List Section - Shows in both server and DM views */}
            <div className="h-full flex flex-col">
              {/* Friends List */}
              <div className="flex-1 overflow-y-auto ">
                {activeView === "server" && activeServer ? (
                  // Server View - Show online/offline members like Discord
                  <div className="py-6 px-3">
                    <label className="text-sm px-3 font-base text-[#73726e] tracking-wide mb-2">
                      Online — {onlineFriends.length}
                    </label>
                    <div className="space-y-2 mb-8">
                      {onlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-[#3a6f43] rounded-full flex items-center justify-center text-white text-lg font-medium">
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0 left-8 w-4 h-4 bg-[#08cb00] border-2 border-white rounded-full "></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium    tracking-wide">
                              {friend.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="text-sm px-3 font-base text-[#73726e]  tracking-wide mb-2">
                      Offline — {offlineFriends.length}
                    </label>
                    <div className="space-y-2">
                      {offlineFriends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#e7e7e9] hover:opacity-100 cursor-pointer group opacity-30"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white text-lg font-medium">
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-medium text-[#222831] tracking-wide">
                              {friend.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeView === "dm" ? (
                  // DM View - Show friend profile
                  <FriendsProfile friend={selectedFriend} />
                ) : (
                  // Default view when no server or DM is selected
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    {hallsLoading
                      ? "Loading..."
                      : "Select a server or friend to view details"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
