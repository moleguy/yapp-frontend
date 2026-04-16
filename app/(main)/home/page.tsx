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
import { Hall, getUserHalls, Room } from "@/lib/api";
import { useResizable } from "@/app/hooks/useResizable";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Friend = {
  id: number;
  name: string;
  avatarUrl?: string;
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [activeHall, setActiveHall] = useState<Hall | null>(null);
  const [lastActiveHall, setLastActiveHall] = useState<Hall | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showChannels, setShowChannels] = useState(false);
  const [showFloorPopup, setShowFloorPopup] = useState(false);
  const [floorPopupHall, setFloorPopupHall] = useState<Hall | null>(
    null,
  );

  const [hallDeselectedManually, setHallDeselectedManually] = useState(false);
  const [friendDeselectedManually, setFriendDeselectedManually] =
    useState(false);

  const user = useUser();
  const { avatarThumbnailUrl, fallback, hasAvatar } = useAvatar();

  const [userHalls, setUserHalls] = useState<Hall[] | null>(null);
  const [hallsLoading, setHallsLoading] = useState(true);

  // Resizable Sidebars
  const leftSidebar = useResizable({
    initialWidth: 350,
    minWidth: 260,
    maxWidth: 500,
    direction: "left",
  });

  const rightSidebar = useResizable({
    initialWidth: 400,
    minWidth: 280,
    maxWidth: 600,
    direction: "right",
    isCollapsible: true,
    collapseThreshold: 180,
  });

  // Friends list
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

  const onlineFriends = friends.filter((f) => f.status === "online");
  const offlineFriends = friends.filter((f) => f.status === "offline");

  // Fetch user halls
  useEffect(() => {
    const fetchUserHalls = async () => {
      try {
        setHallsLoading(true);
        const fetchedHalls = await getUserHalls();
        if (fetchedHalls && Array.isArray(fetchedHalls)) {
          setHalls(fetchedHalls);
          setUserHalls(fetchedHalls);
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

  // Restore last active view, server, friend, and deselection state
  useEffect(() => {
    const savedView = localStorage.getItem("lastActiveView") as
      | "server"
      | "dm"
      | null;
    const savedServerId = localStorage.getItem("lastActiveServerId");
    const hallDeselected = JSON.parse(
      localStorage.getItem("hallDeselectedManually") || "false",
    );
    const friendDeselected = JSON.parse(
      localStorage.getItem("friendDeselectedManually") || "false",
    );
    const savedFriendId = localStorage.getItem("lastSelectedFriendId");

    setHallDeselectedManually(hallDeselected);
    setFriendDeselectedManually(friendDeselected);
    if (savedView) setActiveView(savedView);

    // Restore last server if not manually deselected
    if (!hallDeselected && savedServerId && halls.length > 0) {
      const savedHall = halls.find((h) => h.id === savedServerId);
      if (savedHall) {
        setLastActiveHall(savedHall);
        if (savedView === "server") {
          setActiveHall(savedHall);
          setSelectedRoom(null);
        }
      }
    }

    // Restore last friend if not manually deselected
    if (!friendDeselected && savedFriendId) {
      const savedFriend = friends.find(
        (f) => f.id.toString() === savedFriendId,
      );
      if (savedFriend) setSelectedFriend(savedFriend);
    }
  }, [halls, friends]);

  // Persist state
  useEffect(() => {
    if (activeView) localStorage.setItem("lastActiveView", activeView);
    localStorage.setItem(
      "hallDeselectedManually",
      JSON.stringify(hallDeselectedManually),
    );
    localStorage.setItem(
      "friendDeselectedManually",
      JSON.stringify(friendDeselectedManually),
    );

    if (activeHall?.id)
      localStorage.setItem("lastActiveServerId", activeHall.id);
    else if (lastActiveHall?.id)
      localStorage.setItem("lastActiveServerId", lastActiveHall.id);

    if (selectedFriend)
      localStorage.setItem(
        "lastSelectedFriendId",
        selectedFriend.id.toString(),
      );
    else localStorage.removeItem("lastSelectedFriendId");
  }, [
    activeView,
    activeHall,
    lastActiveHall,
    hallDeselectedManually,
    selectedFriend,
    friendDeselectedManually,
  ]);

  // Server / hall click
  const handleHallClick = (hall: Hall) => {
    setActiveHall(hall);
    setSelectedRoom(null); // ServerDetails will pick a default room
    setLastActiveHall(hall);
    setHallDeselectedManually(false);
    setActiveView("server");
  };

  const handleLeaveHall = (hallId: string) => {
    const hallIndex = halls.findIndex((h) => h.id === hallId);
    if (hallIndex !== -1) {
      const newHalls = halls.filter((h) => h.id !== hallId);
      setHalls(newHalls);

      if (activeHall?.id === hallId) {
        const nextHall =
          newHalls.length > 0
            ? newHalls[Math.min(hallIndex, newHalls.length - 1)]
            : null;
        setActiveHall(nextHall);
      }
    }
  };

  // Server tab click
  const handleHallsTabClick = () => {
    if (activeView === "server" && activeHall) {
      // Deselect hall if already on server tab
      setActiveHall(null);
      setSelectedRoom(null);
      setHallDeselectedManually(true);
    } else {
      // Switch to server tab
      setActiveView("server");

      // Emulate last active hall click
      if (!hallDeselectedManually && lastActiveHall) {
        setActiveHall(lastActiveHall);
      } else if (halls.length > 0 && !hallDeselectedManually) {
        setActiveHall(halls[0]);
      }
    }
  };

  // DM tab click
  const handleDMTabClick = () => {
    if (activeView === "dm") {
      setSelectedFriend(null);
      setFriendDeselectedManually(true);
    } else {
      setActiveView("dm");
      if (!friendDeselectedManually && selectedFriend)
        setSelectedFriend(selectedFriend);
    }
  };

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    setFriendDeselectedManually(false);
    setActiveView("dm");
  };

  const handleCreateFloorClick = (hall: Hall) => {
    setFloorPopupHall(hall);
    setShowFloorPopup(true);
  };

  const handleOpenFloorPopup = () => {
    if (activeHall) {
      setFloorPopupHall(activeHall);
      setShowFloorPopup(true);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-black text-black font-MyFont">
        <div className="relative w-full flex bg-[#EAE4D5] m-1 overflow-hidden">
          {/* Sidebar */}
          <div
            style={{ width: `${leftSidebar.width}px` }}
            className="flex flex-col h-full bg-[#f3f3f4] rounded-l-lg transition-[width] duration-75 ease-out relative flex-shrink-0"
          >
            <ServerList
              servers={halls}
              setServers={setHalls}
              activeServer={activeHall}
              onServerClick={handleHallClick}
              onLeaveServer={handleLeaveHall}
              onDirectMessagesClick={handleDMTabClick}
              onServersToggle={handleHallsTabClick}
              activeView={activeView}
              onCreateCategoryClick={handleCreateFloorClick}
              isLoading={hallsLoading}
              showChannels={showChannels}
              setShowChannels={setShowChannels}
            />

            {/* Channels / DM section */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto ${activeView === "server" && activeHall ? "border-t border-[#dcd9d3]" : ""}`}
            >
              {activeView === "server" && activeHall ? (
                <ServerDetails
                  activeServer={activeHall}
                  onSelectChannel={(room) => setSelectedRoom(room as unknown as Room)}
                  showCategoryPopup={
                    showFloorPopup &&
                    floorPopupHall?.id === activeHall.id
                  }
                  onCloseCategoryPopup={() => setShowFloorPopup(false)}
                  onOpenCategoryPopup={handleOpenFloorPopup}
                  showChannels={showChannels}
                />
              ) : activeView === "dm" ? (
                <DirectMessages
                  friends={friends}
                  onSelectFriend={handleFriendClick}
                  selectedFriend={selectedFriend}
                />
              ) : null}
            </div>

            {/* Profile + controls */}
            <div className="flex m-3 py-2 px-2 bg-white border border-[#D4C9BE] rounded-xl select-none items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-center min-w-0">
                {hasAvatar ? (
                  <Image
                    src={avatarThumbnailUrl}
                    alt="Profile"
                    className="w-10 h-10 object-cover rounded-full flex-shrink-0"
                    width={80}
                    height={80}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                    {fallback}
                  </div>
                )}
                <div className="ml-2 font-MyFont text-[#393E46] min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.display_name || "No Name"}
                  </p>
                  <p className="text-xs truncate text-gray-500">
                    @{user?.username || "no-username"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div
                  className={`cursor-pointer flex justify-center items-center p-1.5 rounded-lg transition-colors ${showMicrophone ? "hover:bg-[#dfdfe1] text-gray-500" : "bg-[#ebc8ca] text-[#cb3b40]"}`}
                  onClick={() => setShowMicrophone(!showMicrophone)}
                >
                  {showMicrophone ? (
                    <BiSolidMicrophone size={20} />
                  ) : (
                    <BiSolidMicrophoneOff size={20} />
                  )}
                </div>
                <div
                  onClick={() => setSettingsOpen(true)}
                  className="flex justify-center items-center p-1.5 rounded-lg hover:bg-[#dfdfe1] cursor-pointer"
                >
                  <SettingsPopup
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onOpen={() => setSettingsOpen(true)}
                  />
                </div>
              </div>
            </div>

            {/* Resize handle for left sidebar */}
            <div
              onMouseDown={leftSidebar.startResizing}
              className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 active:bg-blue-500/50 transition-colors z-10"
            />
          </div>

          {/* Chat Area */}
          <div className="relative flex-1 flex flex-col justify-between bg-[#fbfbfb] border-r border-[#dcd9d3] min-w-0">
            {hallsLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading your halls...
              </div>
            ) : activeView === "server" && activeHall && selectedRoom ? (
              <ChatArea
                serverName={activeHall.name}
                channelName={selectedRoom.name}
                hallId={activeHall.id}
                roomId={selectedRoom.id}
                isDm={false}
                onToggleRightSidebar={rightSidebar.toggleCollapse}
                isRightSidebarCollapsed={rightSidebar.isCollapsed}
              />
            ) : activeView === "dm" && selectedFriend ? (
              <ChatArea
                friendDisplayName={selectedFriend.name}
                friendId={selectedFriend.id.toString()}
                isDm={true}
                onToggleRightSidebar={rightSidebar.toggleCollapse}
                isRightSidebarCollapsed={rightSidebar.isCollapsed}
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
          </div>

          {/* Friends Sidebar */}
          <div
            style={{ width: `${rightSidebar.width}px` }}
            className={`flex flex-col bg-[#fbfbfb] rounded-r-lg transition-[width] duration-75 ease-out relative flex-shrink-0 ${rightSidebar.isCollapsed ? "overflow-hidden" : ""}`}
          >
            {/* Toggle button for collapsed state */}
            {rightSidebar.isCollapsed && (
              <button
                onClick={rightSidebar.toggleCollapse}
                className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-[#f3f3f4] border border-[#dcd9d3] border-l-0 rounded-r-md hover:bg-gray-200 transition-colors z-20"
                title="Open Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {!rightSidebar.isCollapsed && (
              <>
                {/* Resize handle for right sidebar (placed on the left edge) */}
                <div
                  onMouseDown={rightSidebar.startResizing}
                  className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400/30 active:bg-blue-500/50 transition-colors z-10"
                />

                <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
                  {activeView === "server" && activeHall ? (
                    <div className="py-6 px-3">
                      <label className="text-sm px-3 font-base text-[#73726e] tracking-wide mb-2 block">
                        Online — {onlineFriends.length}
                      </label>
                      <div className="space-y-2 mb-8">
                        {onlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-[#e7e7e9] text-[#73726e] hover:text-[#222831]"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-[#3a6f43] rounded-full flex items-center justify-center text-white text-lg font-medium">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-0 left-8 w-4 h-4 bg-[#08cb00] border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-medium tracking-wide truncate">
                                {friend.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <label className="text-sm px-3 font-base text-[#73726e] tracking-wide mb-2 block">
                        Offline — {offlineFriends.length}
                      </label>
                      <div className="space-y-2">
                        {offlineFriends.map((friend) => (
                          <div
                            key={friend.id}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#e7e7e9] hover:opacity-100 cursor-pointer group opacity-30"
                          >
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white text-lg font-medium">
                                {friend.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-lg font-medium text-[#222831] tracking-wide truncate">
                                {friend.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeView === "dm" ? (
                    <FriendsProfile friend={selectedFriend} />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 px-4 text-center">
                      {hallsLoading
                        ? "Loading..."
                        : "Select a server or friend to view details"}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
