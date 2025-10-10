// components/DirectMessages.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import FriendsProfile from "@/app/(main)/components/FriendsProfile";
import { IoIosSearch, IoIosClose } from "react-icons/io";
import Image from "next/image";
import { GoDotFill } from "react-icons/go";

type Friend = {
  id: number;
  name: string;
  status?: "online" | "offline"; // optional (e.g., online, offline)
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
                                       }: DirectMessagesProps){
    const [friendContextMenu, setFriendContextMenu] = useState<FriendContextMenu | null>(null);
    const friendMenuRef = useRef<HTMLDivElement | null>(null);
    const [query, setQuery] = useState("");
    // const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // if(!friendContextMenu) return;

        function handleClickOutside(e: MouseEvent){
            if(
                friendContextMenu &&
                friendMenuRef.current &&
                !friendMenuRef.current.contains(e.target as Node)
            ){
                setFriendContextMenu(null);
            }
        }

        if(friendContextMenu){
            window.addEventListener("mousedown", handleClickOutside);
        } else {
            window.removeEventListener("mousedown", handleClickOutside);
        }

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [friendContextMenu]);

    const handleFriendDoubleClick = (e: React.MouseEvent, friend: Friend) => {
        e.preventDefault();
        e.stopPropagation();
        setFriendContextMenu({
            x: e.pageX,
            y: e.pageY,
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
        <div className="relative border-b border-[#dcd9d3] px-4 pb-4">
            <input
                value={query}
                ref={inputRef}
                placeholder={`Search for friends...`}
                onChange={(e) => setQuery(e.target.value)}
                className="relative py-2 px-2 border border-[#dcd9d3] text-[#222831] rounded-lg w-full focus:outline-none"
            />
            {query ? (
                <button onClick={handleClear}>
                    <IoIosClose className="absolute w-8 h-8 top-5 right-7 -translate-y-1/2 cursor-pointer" />
                </button>
            ) : (
                <button>
                    <IoIosSearch className="absolute w-7 h-7 top-5 right-7 -translate-y-1/2" />
                </button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto">
            {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    {query ? (
                        <p>No friends found matching &quot;{query}&quot;</p>
                    ) : (
                    <>
                        <p className="text-lg mb-2">
                            There are no friends online at this time.
                        </p>
                        <p className="text-sm">Check back later</p>
                    </>
                    )}
                </div>
                ) : (
                <ul className="space-y-2">
                    {filteredFriends.map((friend) => (
                        <li
                            key={friend.id}
                            className={`relative flex items-center justify-start gap-3 mx-2 px-2 py-2 rounded-lg cursor-pointer group ${
                                selectedFriend?.id === friend.id ? 'bg-[#dddde0]' : 'hover:bg-[#e7e7e9]'
                            }`}
                            onClick={() => {
                                onSelectFriend(friend);
                            }}
                            onContextMenu={(e) => handleFriendDoubleClick(e, friend)}
                        >
                            <div className="rounded-full w-12 h-12 bg-gray-500">
                                {/* NEEDS TO FETCH USER IMAGE HERE */}
                                {/*<Image*/}
                                {/*    // src={}*/}
                                {/*    alt={`friends image`}*/}
                                {/*/>*/}
                            </div>
                            <span className={`absolute bottom-3 left-11 w-4 h-4 rounded-full flex items-center justify-center duration-200 ${
                                selectedFriend?.id === friend.id
                                    ? 'bg-[#dddde0]' 
                                    : 'bg-[#f3f3f4] group-hover:bg-[#e7e7e9]' 
                            }`}
                            >
                                <GoDotFill className={`w-4 h-4 ${friend.status === "online" ? "text-[#08cb00]" : "text-[#7e7f87]"}`}/>
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
                <div
                    ref={friendMenuRef}
                    className={`flex flex-col items-center gap-1 py-2 px-2 fixed z-100 border rounded-xl border-[#dcd9d3] shadow-xl w-44  bg-[#ffffff] text-[#1e1e1e] text-sm tracking-wide font-base`}
                    style={{ top: friendContextMenu.y, left: friendContextMenu.x }}
                >
                    {[
                        {label: "Profile", action: "profile"},
                        { label: "Call", action: "call" },
                        { label: "Invite to Server", action: "invite" },
                        { label: "Block", action: "block" },
                        { label: "Mute", action: "mute" },
                    ].map((item, index, array) => (
                        <React.Fragment key={item.action}>
                            <button
                                className={` w-full text-left hover:bg-[#f2f2f3] rounded-md cursor-pointer py-2 px-2 font-base tracking-wide ${
                                    item.action === "block" ? "text-[#cb3b40] hover:bg-[#fbeff0]" : "text-[#1e1e1e]"
                                }`}
                            >
                                {item.label}
                            </button>
                            {/*{*/}
                            {/*    index<array.length -1 && (*/}
                            {/*        <div className={`h-px bg-gray-200 w-full my-1`}/>*/}
                            {/*    )*/}
                            {/*}*/}
                        </React.Fragment>
                    ))
                    }
                </div>
            )}

    </div>
  );
};

