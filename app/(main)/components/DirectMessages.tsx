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
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ friends }) => {
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
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer "
                        >
                            <span>{friend.name}</span>
                            {friend.status && (
                                <span className="text-xs text-gray-500">{friend.status}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DirectMessages;
