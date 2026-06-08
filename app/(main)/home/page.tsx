"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BiSolidMicrophone, BiSolidMicrophoneOff } from "react-icons/bi";
import SettingsPopup from "../components/SettingsPopup";
import Image from "next/image";
import HallList from "../components/HallList";
import InvitePeoplePopup from "../components/InvitePeoplePopup";
import ProtectedRoute from "../components/ProtectedRoute";
import HallDetails from "@/app/(main)/components/HallDetails";
import DirectMessages from "../components/DirectMessages";
import FriendsProfile from "../components/FriendsProfile";
import ChatArea from "@/app/(main)/components/ChatArea";
import { useAvatar, useUser } from "@/app/store/useUserStore";
import { Hall, getUserHalls, Room, deleteHall, leaveHall, type PresenceStatus } from "@/lib/api";
import { useHallMembers, useHallRoles, useHallStore, useSelectHall } from "@/app/store/useHallStore";
import { setLastRoomIdForHall, clearLastRoomIdForHall } from "@/lib/hallRoomPersistence";
import { useFetchFriends, useFriends } from "@/app/store/useFriendsStore";
import { useMyPresence, usePresenceByUserId, useSetMyPresence } from "@/app/store/usePresenceStore";
import { usePresenceSync } from "@/app/hooks/usePresenceSync";
import { useResizable } from "@/app/hooks/useResizable";
import { useDialog } from "@/app/contexts/DialogContext";
import { LoadingState, EmptyState, ErrorState } from "@/app/(main)/components/FeedbackStates";
import { Hash, MessageCircle } from "lucide-react";
import PresenceSelect from "../components/PresenceSelect";
import HallMembersPanel from "../components/HallMembersPanel";

type Friend = {
  id: string;
  name: string;
  avatarUrl?: string;
  status?: PresenceStatus;
  mutualFriends?: number;
  username?: string;
  memberSince?: string;
  mutualHalls?: number;
  tags?: string;
};

export default function HomePage() {
  const { confirm } = useDialog();
  const [showMicrophone, setShowMicrophone] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("General");
  const [activeView, setActiveView] = useState<"hall" | "dm" | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [activeHall, setActiveHall] = useState<Hall | null>(null);
  const [lastActiveHall, setLastActiveHall] = useState<Hall | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showRooms, setShowRooms] = useState(false);
  const [showFloorPopup, setShowFloorPopup] = useState(false);
  const [showRoomPopup, setShowRoomPopup] = useState(false);
  const [floorPopupHall, setFloorPopupHall] = useState<Hall | null>(null);
  const [inviteHall, setInviteHall] = useState<Hall | null>(null);

  const [hallDeselectedManually, setHallDeselectedManually] = useState(false);
  const [friendDeselectedManually, setFriendDeselectedManually] = useState(false);

  const user = useUser();
  const { avatarThumbnailUrl, fallback, hasAvatar } = useAvatar();
  const [userHalls, setUserHalls] = useState<Hall[] | null>(null);
  const [hallsLoading, setHallsLoading] = useState(true);

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
    storageKey: "members-panel",
  });

  const fetchFriends = useFetchFriends();
  const apiFriends = useFriends();
  const selectHall = useSelectHall();
  const hallMembers = useHallMembers();
  const hallRoles = useHallRoles();
  const hallMembersLoading = useHallStore((s) => s.loading);
  const presenceByUserId = usePresenceByUserId();
  const presenceStatus = useMyPresence();
  const setMyPresence = useSetMyPresence();

  const watchedUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const friend of apiFriends) ids.add(friend.id);
    for (const member of hallMembers) ids.add(member.user_id);
    return [...ids];
  }, [apiFriends, hallMembers]);
  usePresenceSync(watchedUserIds);

  const friends: Friend[] = useMemo(
    () =>
      apiFriends.map((u) => ({
        id: u.id,
        name: u.display_name,
        username: u.username,
        avatarUrl: u.avatar_thumbnail_url ?? undefined,
        status: presenceByUserId[u.id] ?? "offline",
        mutualFriends: u.mutual_friend_count,
      })),
    [apiFriends, presenceByUserId]
  );

  const selectedFriend = useMemo(
    () => friends.find((f) => f.id === selectedFriendId) ?? null,
    [friends, selectedFriendId]
  );

  const sessionRestoredRef = useRef(false);
  const friendRestoredRef = useRef(false);

  useEffect(() => {
    if (activeView !== "hall" || !activeHall?.id) return;
    if (useHallStore.getState().selectedHallId !== activeHall.id) {
      void selectHall(activeHall.id);
    }
  }, [activeView, activeHall?.id, selectHall]);

  // Fix: Handle the promise and loading state correctly
  useEffect(() => {
    const fetchHalls = async () => {
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
    void fetchHalls();
    void fetchFriends();
  }, [fetchFriends]);

  // Restore hall/view selection once after halls load (not on every render)
  useEffect(() => {
    if (sessionRestoredRef.current || halls.length === 0) return;
    sessionRestoredRef.current = true;

    const rawView = localStorage.getItem("lastActiveView");
    const savedView = (rawView === "server" ? "hall" : rawView) as "hall" | "dm" | null;
    const savedHallId =
      localStorage.getItem("lastActiveHallId") ??
      localStorage.getItem("lastActiveServerId");
    const hallDeselected = JSON.parse(localStorage.getItem("hallDeselectedManually") || "false");
    const friendDeselected = JSON.parse(localStorage.getItem("friendDeselectedManually") || "false");

    setHallDeselectedManually(hallDeselected);
    setFriendDeselectedManually(friendDeselected);
    if (savedView) setActiveView(savedView);

    if (!hallDeselected && savedHallId) {
      const savedHall = halls.find((h) => h.id === savedHallId);
      if (savedHall) {
        setLastActiveHall(savedHall);
        if (savedView === "hall") {
          setActiveHall(savedHall);
          setSelectedRoom(null);
          void selectHall(savedHall.id);
        }
      }
    }

    if (friendDeselected) {
      friendRestoredRef.current = true;
    }
  }, [halls, selectHall]);

  // Restore selected friend once after friends load
  useEffect(() => {
    if (friendRestoredRef.current || friends.length === 0) return;

    const friendDeselected = JSON.parse(localStorage.getItem("friendDeselectedManually") || "false");
    const savedFriendId = localStorage.getItem("lastSelectedFriendId");
    friendRestoredRef.current = true;

    if (!friendDeselected && savedFriendId && friends.some((f) => f.id === savedFriendId)) {
      setSelectedFriendId(savedFriendId);
    }
  }, [friends]);

  useEffect(() => {
    if (activeView) localStorage.setItem("lastActiveView", activeView);
    localStorage.setItem("hallDeselectedManually", JSON.stringify(hallDeselectedManually));
    localStorage.setItem("friendDeselectedManually", JSON.stringify(friendDeselectedManually));

    if (activeHall?.id) localStorage.setItem("lastActiveHallId", activeHall.id);
    else if (lastActiveHall?.id) localStorage.setItem("lastActiveHallId", lastActiveHall.id);

    if (selectedFriendId) localStorage.setItem("lastSelectedFriendId", selectedFriendId);
    else localStorage.removeItem("lastSelectedFriendId");
  }, [activeView, activeHall, lastActiveHall, hallDeselectedManually, selectedFriendId, friendDeselectedManually]);

  const handleHallClick = (hall: Hall) => {
    if (activeHall?.id === hall.id) return;
    setActiveHall(hall);
    setSelectedRoom(null);
    setLastActiveHall(hall);
    setHallDeselectedManually(false);
    setActiveView("hall");
    localStorage.setItem("lastActiveView", "hall");
    localStorage.setItem("lastActiveHallId", hall.id);
    localStorage.setItem("hallDeselectedManually", "false");
    void selectHall(hall.id);
  };

  const handleLeaveHall = async (hallId: string) => {
    try {
      const hallToDelete = halls.find((h) => h.id === hallId);
      const isOwner = hallToDelete?.owner_id === user?.id;

      let success = false;
      if (isOwner) {
        if (!(await confirm({ message: "Delete this Hall?", destructive: true }))) return;
        success = await deleteHall(hallId);
      } else {
        if (!(await confirm({ message: "Leave this Hall?", destructive: true, confirmLabel: "Leave" }))) return;
        success = await leaveHall(hallId);
      }

      if (success) {
        clearLastRoomIdForHall(hallId);
        const newHalls = halls.filter((h) => h.id !== hallId);
        setHalls(newHalls);
        if (activeHall?.id === hallId) {
          setActiveHall(newHalls[0] || null);
          setSelectedRoom(null);
        }
      }
    } catch (error) {
      console.error("Error leaving hall:", error);
    }
  };

  const handleHallsTabClick = () => {
    if (activeView === "hall" && activeHall) {
      setActiveHall(null);
      setSelectedRoom(null);
      setHallDeselectedManually(true);
    } else {
      setActiveView("hall");
      if (!hallDeselectedManually && lastActiveHall) setActiveHall(lastActiveHall);
      else if (halls.length > 0 && !hallDeselectedManually) setActiveHall(halls[0]);
    }
  };

  const handleDMTabClick = () => {
    if (activeView === "dm") {
      setSelectedFriendId(null);
      setFriendDeselectedManually(true);
      localStorage.setItem("friendDeselectedManually", "true");
      localStorage.removeItem("lastSelectedFriendId");
    } else {
      setActiveView("dm");
      localStorage.setItem("lastActiveView", "dm");
      if (!friendDeselectedManually && selectedFriendId) setSelectedFriendId(selectedFriendId);
    }
  };

  const openSettings = useCallback((tab: string = "General") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, []);

  const handleSelectRoom = useCallback((room: Room) => {
    if (!activeHall || room.hall_id !== activeHall.id) return;
    setSelectedRoom(room);
    setLastRoomIdForHall(room.hall_id, room.id);
  }, [activeHall]);

  const handleDeselectRoom = useCallback((hallId: string) => {
    setSelectedRoom(null);
    clearLastRoomIdForHall(hallId);
  }, []);

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriendId(friend.id);
    setFriendDeselectedManually(false);
    setActiveView("dm");
    localStorage.setItem("lastActiveView", "dm");
    localStorage.setItem("lastSelectedFriendId", friend.id);
    localStorage.setItem("friendDeselectedManually", "false");
  };

  return (
      <ProtectedRoute>
        <div className="flex h-screen bg-black text-heading font-MyFont">
          <div className="relative w-full flex bg-surface-shell m-1 overflow-hidden">
            {/* Left Sidebar */}
            <div
                style={{ width: `${leftSidebar.width}px` }}
                className="flex flex-col h-full bg-surface-sidebar rounded-l-lg transition-[width] duration-75 ease-out relative flex-shrink-0"
            >
              <HallList
                  halls={halls}
                  setHalls={setHalls}
                  activeHall={activeHall}
                  onHallClick={handleHallClick}
                  onLeaveHall={handleLeaveHall}
                  onDirectMessagesClick={handleDMTabClick}
                  onHallsToggle={handleHallsTabClick}
                  activeView={activeView}
                  onCreateCategoryClick={(hall) => { setFloorPopupHall(hall); setShowFloorPopup(true); }}
                  onCreateRoomClick={(hall) => { setActiveHall(hall); setShowRoomPopup(true); }}
                  isLoading={hallsLoading}
                  showRooms={showRooms}
                  setShowRooms={setShowRooms}
                  currentUserId={user?.id}
                  onInviteHall={setInviteHall}
              />

              <div className={`flex-1 min-h-0 overflow-y-auto ${activeView === "hall" && activeHall ? "border-t border-default" : ""}`}>
                {activeView === "hall" && activeHall ? (
                    <HallDetails
                        activeHall={activeHall}
                        selectedRoomId={
                          selectedRoom?.hall_id === activeHall.id
                            ? selectedRoom.id
                            : null
                        }
                        onSelectRoom={handleSelectRoom}
                        onDeselectRoom={handleDeselectRoom}
                        onToggleRightSidebar={rightSidebar.toggleCollapse}
                        isRightSidebarCollapsed={rightSidebar.isCollapsed}
                        showCategoryPopup={showFloorPopup && floorPopupHall?.id === activeHall.id}
                        onCloseCategoryPopup={() => setShowFloorPopup(false)}
                        onOpenCategoryPopup={() => { setFloorPopupHall(activeHall); setShowFloorPopup(true); }}
                        showRoomPopup={showRoomPopup}
                        onCloseRoomPopup={() => setShowRoomPopup(false)}
                        onOpenRoomPopup={() => setShowRoomPopup(true)}
                        currentUserId={user?.id}
                        onInviteHall={setInviteHall}
                        onLeaveHall={handleLeaveHall}
                    />
                ) : activeView === "dm" ? (
                    <DirectMessages friends={friends} onSelectFriend={handleFriendClick} selectedFriend={selectedFriend} />
                ) : null}
              </div>

              {/* Profile Section */}
              <div className="relative z-30 flex m-3 py-2 px-2 bg-surface-card border border-accent rounded-xl items-center justify-between gap-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openSettings("Profile")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openSettings("Profile");
                    }
                  }}
                  className="flex items-center min-w-0 flex-1 text-left rounded-lg pl-1.5 pr-1 -my-1 py-1 cursor-pointer transition-colors hover:bg-list-hover active:bg-list-selected"
                  aria-label="Open profile settings"
                >
                  {hasAvatar ? (
                      <Image
                        key={avatarThumbnailUrl}
                        src={avatarThumbnailUrl}
                        alt="User profile picture"
                        className="w-10 h-10 object-cover rounded-full flex-shrink-0"
                        width={80}
                        height={80}
                        unoptimized
                      />
                  ) : (
                      <div className="w-10 h-10 bg-surface-strong rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">{fallback}</div>
                  )}
                  <div className="ml-2 font-MyFont text-body min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.display_name || "No Name"}
                      </p>
                      <PresenceSelect
                        value={presenceStatus}
                        onChange={(status) => setMyPresence(status)}
                      />
                    </div>
                    <p className="text-xs truncate text-list-muted">
                      @{user?.username || "no-username"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* TODO: Add back the microphone toggle component after voice call feature is available in the backend*/}
                  {/* <div
                      className={`cursor-pointer flex justify-center items-center p-1.5 rounded-lg transition-colors ${showMicrophone ? "hover:bg-surface-control-hover text-list-muted" : "bg-destructive-hover text-destructive"}`}
                      onClick={() => setShowMicrophone(!showMicrophone)}
                  >
                    {showMicrophone ? <BiSolidMicrophone size={20} /> : <BiSolidMicrophoneOff size={20} />}
                  </div> */}
                  <SettingsPopup
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onOpen={() => openSettings("General")}
                    initialTab={settingsTab}
                  />
                </div>
              </div>

              <div onMouseDown={leftSidebar.startResizing} className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10" />
            </div>

            {/* Main Chat Area */}
            <div className="relative flex-1 flex flex-col justify-between bg-surface-app border-r border-default min-w-0">
              {hallsLoading ? (
                  <LoadingState message="Loading your halls…" />
              ) : userHalls === null ? (
                  <ErrorState
                    title="Couldn't load halls"
                    message="Something went wrong while fetching your halls. Please try again."
                    action={{ label: "Retry", onClick: () => window.location.reload() }}
                  />
              ) : activeView === "hall" && activeHall && selectedRoom ? (
                  <ChatArea
                      hallName={activeHall.name}
                      roomName={selectedRoom.name}
                      hallId={activeHall.id}
                      roomId={selectedRoom.id}
                      isDm={false}
                  />
              ) : activeView === "dm" && selectedFriend ? (
                  <ChatArea
                      friendDisplayName={selectedFriend.name}
                      friendId={selectedFriend.id}
                      isDm={true}
                  />
              ) : activeView === "dm" ? (
                  <EmptyState
                    title="No conversation selected"
                    description="Select a friend from the sidebar to start chatting."
                    icon={<MessageCircle className="w-7 h-7" />}
                  />
              ) : (
                  <EmptyState
                    title="No room selected"
                    description="Pick a room from the sidebar to start chatting."
                    icon={<Hash className="w-7 h-7" />}
                  />
              )}
            </div>

            {/* Right Sidebar (Friends/Profile) */}
            <div
                style={{ width: rightSidebar.isCollapsed ? "0px" : `${rightSidebar.width}px` }}
                className={`flex flex-col bg-surface-app rounded-r-lg transition-[width] duration-150 ease-out relative flex-shrink-0 ${
                    !rightSidebar.isCollapsed ? "border-l border-default" : ""
                }`}
            >
              {!rightSidebar.isCollapsed && (
                  <>
                    <div onMouseDown={rightSidebar.startResizing} className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10" />
                    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
                      {activeView === "hall" && activeHall ? (
                          <HallMembersPanel
                            members={hallMembers}
                            roles={hallRoles}
                            currentUserId={user?.id}
                            loading={hallMembersLoading && hallMembers.length === 0}
                          />
                      ) : activeView === "dm" ? (
                          <FriendsProfile friend={selectedFriend} />
                      ) : (
                          <div className="flex-1 flex items-center justify-center text-list-muted px-4 text-center">Select something to view details</div>
                      )}
                    </div>
                  </>
              )}
            </div>
          </div>
        </div>

        <InvitePeoplePopup
          isOpen={!!inviteHall}
          onClose={() => setInviteHall(null)}
          hall={inviteHall}
          currentUserId={user?.id}
        />
      </ProtectedRoute>
  );
}