// components/DirectMessages.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { IoIosSearch, IoIosClose } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import { ContextMenu, type ContextMenuItem } from "@/app/(main)/components/ContextMenu";
import { listItemClasses } from "@/lib/listItemClasses";
import { EmptyState } from "@/app/(main)/components/FeedbackStates";
import { Search, Users } from "lucide-react";
import type { PresenceStatus } from "@/lib/api";
import { presenceTextClass } from "@/lib/presenceUtils";

type Friend = {
    id: string;
    name: string;
    status?: PresenceStatus;
};

type FriendContextMenu = {
    x: number,
    y: number,
    friend: Friend | null,
};

interface DirectMessagesProps {
    friends: Friend[];
    onSelectFriend: (friend: Friend) => void;
    selectedFriend: Friend | null;
}

export default function DirectMessages({
    friends,
    onSelectFriend,
    selectedFriend,
}: DirectMessagesProps) {
    const [friendContextMenu, setFriendContextMenu] = useState<FriendContextMenu | null>(null);
    const friendMenuRef = useRef<HTMLDivElement | null>(null);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // if(!friendContextMenu) return;

        function handleClickOutside(e: MouseEvent) {
            if (
                friendContextMenu &&
                friendMenuRef.current &&
                !friendMenuRef.current.contains(e.target as Node)
            ) {
                setFriendContextMenu(null);
            }
        }

        if (friendContextMenu) {
            window.addEventListener("mousedown", handleClickOutside);
        } else {
            window.removeEventListener("mousedown", handleClickOutside);
        }

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [friendContextMenu]);

    const handleFriendRightClick = (e: React.MouseEvent, friend: Friend) => {
        e.preventDefault();
        e.stopPropagation();
        setFriendContextMenu({
            x: e.clientX,
            y: e.clientY,
            friend: friend,
        });
    };

    const handleClear = () => {
        setQuery("");
        inputRef.current?.focus();
    };

    // filtering friends based on query search
    const filteredFriends = friends.filter((friend) =>
        friend.name.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className=" space-y-2 select-none">
            <h2 className="text-lg font-medium px-4 py-2 tracking-wide">
                Direct Messages
            </h2>
            <div className="relative border-b border-default px-4 pb-4">
                <div className="relative">
                    <input
                        value={query}
                        ref={inputRef}
                        placeholder="Search for friends..."
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full py-2 pl-2 pr-10 border border-default text-list-emphasis rounded-lg focus:outline-none"
                    />
                    {query ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            aria-label="Clear search"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-list-muted hover:bg-list-hover hover:text-list-emphasis transition-colors cursor-pointer"
                        >
                            <IoIosClose className="w-6 h-6" />
                        </button>
                    ) : (
                        <IoIosSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-list-muted pointer-events-none" />
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredFriends.length === 0 ? (
                    query ? (
                        <EmptyState
                            title="No matches"
                            description={`No friends found matching "${query}".`}
                            icon={<Search className="w-7 h-7" />}
                            fullHeight={false}
                        />
                    ) : (
                        <EmptyState
                            title="No friends yet"
                            description="Add friends to start direct messages."
                            icon={<Users className="w-7 h-7" />}
                            fullHeight={false}
                        />
                    )
                ) : (
                    <ul className="space-y-2">
                        {filteredFriends.map((friend) => (
                            <li
                                key={friend.id}
                                className={`relative flex items-center justify-start gap-3 mx-2 px-2 py-2 rounded-lg cursor-pointer group ${listItemClasses(selectedFriend?.id === friend.id)}`}
                                onClick={() => {
                                    onSelectFriend(friend);
                                }}
                                onContextMenu={(e) => handleFriendRightClick(e, friend)}
                            >
                                <div className="rounded-full w-12 h-12 bg-surface-strong">
                                    {/* NEEDS TO FETCH USER IMAGE HERE */}
                                    {/*<Image*/}
                                    {/*    // src={}*/}
                                    {/*    alt={`friends image`}*/}
                                    {/*/>*/}
                                </div>
                                <span className={`absolute bottom-3 left-11 w-4 h-4 rounded-full flex items-center justify-center duration-200 ${selectedFriend?.id === friend.id
                                    ? 'bg-list-selected'
                                    : 'bg-surface-sidebar group-hover:bg-list-hover'
                                    }`}
                                >
                                    <GoDotFill className={`w-4 h-4 ${presenceTextClass(friend.status)}`} />
                                </span>
                                <div className="flex justify-center items-center gap-4">
                                    <span>{friend.name}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>


            {/* Context menu for list of friends which mainly includes:
        Profile
        Call
        Invite
        Block
        Mute
    */}

            {friendContextMenu && (
                <ContextMenu
                    ref={friendMenuRef}
                    x={friendContextMenu.x}
                    y={friendContextMenu.y}
                    items={[
                        { label: "Profile", onClick: () => setFriendContextMenu(null) },
                        { label: "Call", onClick: () => setFriendContextMenu(null) },
                        { label: "Invite to Hall", onClick: () => setFriendContextMenu(null) },
                        { label: "Block", danger: true, onClick: () => setFriendContextMenu(null) },
                        { label: "Mute", onClick: () => setFriendContextMenu(null) },
                    ] satisfies ContextMenuItem[]}
                />
            )}
        </div>
    );
};

