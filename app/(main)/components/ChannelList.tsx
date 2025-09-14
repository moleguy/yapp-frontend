'use client';

import React from "react";

type Server = {
    id: number;
    name: string;
    image?: string;
};

type Props = {
    server: Server;
};

export default function ChannelList({ server }: Props) {
    return (
        <div className="flex flex-col w-[300px] bg-[#f5f5f5] border-r border-gray-300">
            {/* Server name at top */}
            <div className="px-4 py-3 border-b border-gray-300 font-bold text-[#222]">
                {server.name}
            </div>

            {/* Text Channels */}
            <div className="px-4 mt-4">
                <h3 className="text-xs uppercase text-gray-500 mb-2">Text Channels</h3>
                <ul className="space-y-2">
                    <li className="cursor-pointer hover:bg-gray-200 p-2 rounded"># general</li>
                    <li className="cursor-pointer hover:bg-gray-200 p-2 rounded"># random</li>
                </ul>
            </div>

            {/* Voice Channels */}
            <div className="px-4 mt-6">
                <h3 className="text-xs uppercase text-gray-500 mb-2">Voice Channels</h3>
                <ul className="space-y-2">
                    <li className="cursor-pointer hover:bg-gray-200 p-2 rounded">🔊 General</li>
                </ul>
            </div>
        </div>
    );
}
