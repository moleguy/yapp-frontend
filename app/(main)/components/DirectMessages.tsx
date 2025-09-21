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
  status?: string; // optional (e.g., online, offline)
};

interface DirectMessagesProps {
  friends: Friend[];
  onSelectFriend: (friend: Friend) => void;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({
  friends,
  onSelectFriend,
}) => {
  const [query, setQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className=" space-y-2">
      <h2 className="text-lg font-semibold px-4 py-2">Direct Messages</h2>
      <div className="relative border-b border-[#dcd9d3] px-4 pb-4">
        <input
          value={query}
          ref={inputRef}
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
      {friends.length === 0 ? (
        <p className="text-gray-500">No friends yet</p>
      ) : (
        // friends: icon(image), name, status: online or offline.
        <ul className="space-y-1">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className={`relative flex items-center justify-start gap-4 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer `}
              onClick={() => onSelectFriend(friend)}
            >
              <div className="rounded-full w-12 h-12 bg-gray-500">
                {/* NEEDS TO FETCH USER IMAGE HERE*/}
                {/*<Image*/}
                {/*    // src={}*/}
                {/*    alt={`friends image`}*/}
                {/*/>*/}
              </div>
              <span className="absolute bottom-3 left-12 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <GoDotFill
                  className={`w-8 h-8 ${friend.status ? "text-[#08cb00]" : "text-[#7e7f87]"} `}
                />
              </span>
              <div className="flex justify-center items-center gap-4">
                <span>{friend.name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DirectMessages;
