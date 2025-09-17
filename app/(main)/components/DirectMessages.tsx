// components/DirectMessages.tsx
"use client";

import React from "react";

type Friend = {
    id: number;
    name: string;
    status?: string; // optional (e.g., online, offline)
};

interface DirectMessagesProps {
    friends: Friend[];
    onSelectFriend: (friend: Friend) => void;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ friends, onSelectFriend }) => {
    return (
        <div className="p-4 space-y-2">
            <h2 className="text-lg font-semibold">Direct Messages</h2>
            {friends.length === 0 ? (
                <p className="text-gray-500">No friends yet</p>
            ) : (
                <ul className="space-y-1">
                    {friends.map((friend) => (
                        <li
                            key={friend.id}
                            className="flex items-center justify-start gap-4 p-2 rounded-lg hover:bg-gray-100 cursor-pointer "
                            onClick={() => onSelectFriend(friend)}
                        >   
                            <div className="rounded-full w-12 h-12 bg-gray-500">
                                
                            </div>
                            <div className="flex justify-center items-center gap-4">
                                <span>{friend.name}</span>
                                {friend.status && (
                                    <span className="text-xs text-gray-500">{friend.status}</span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DirectMessages;
