'use client';

import React, { useState, useEffect } from 'react';
import { FaHashtag, FaPlus } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import AddChannelPopup from "@/app/(main)/components/AddChannelPopup";

type Server = {
    id: number;
    name: string;
    image?: string;
};

type Channel = {
    id: string;
    name: string;
    type: 'text' | 'voice';
    category: 'text' | 'voice';
};

interface ServerDetailsProps {
    activeServer: Server | null;
}

const defaultChannels: Channel[] = [
    { id: '1', name: 'general', type: 'text', category: 'text' },
    { id: '2', name: 'announcements', type: 'text', category: 'text' },
    { id: '3', name: 'voice-chat', type: 'voice', category: 'voice' },
    { id: '4', name: 'music-lounge', type: 'voice', category: 'voice' },
];

export default function ServerDetails({ activeServer }: ServerDetailsProps) {
    const [serverChannels, setServerChannels] = useState<Record<number, Channel[]>>({});
    const [popupCategory, setPopupCategory] = useState<'text' | 'voice' | null>(null);

    // Ensure active server always has channels initialized
    useEffect(() => {
        if (activeServer && !serverChannels[activeServer.id]) {
            setServerChannels(prev => ({
                ...prev,
                [activeServer.id]: [...defaultChannels],
            }));
        }
    }, [activeServer, serverChannels]);

    if (!activeServer) {
        return (
            <div className="h-full w-full flex items-center justify-center text-center text-[#222831] text-xl font-medium">
                Create a server to view its details.
            </div>
        );
    }

    const channels = serverChannels[activeServer.id] || [];
    const textChannels = channels.filter(c => c.category === 'text');
    const voiceChannels = channels.filter(c => c.category === 'voice');

    const handleAddChannel = (
        category: 'text' | 'voice',
        type: 'text' | 'voice',
        name: string
    ) => {
        const newChannel: Channel = {
            id: Date.now().toString(),
            name,
            type,
            category,
        };

        setServerChannels(prev => ({
            ...prev,
            [activeServer.id]: [...(prev[activeServer.id] || []), newChannel],
        }));
    };

    return (
        <div className="h-full w-full p-4 flex flex-col">
            {/* Server Header */}
            <div className="flex items-center pb-2 gap-2">
                {activeServer.image ? (
                    <img
                        src={activeServer.image}
                        alt={activeServer.name}
                        className="w-8 h-8 rounded-xl object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#6164f2] text-[#eeeffe] flex items-center justify-center text-xl">
                        {activeServer.name
                            .trim()
                            .split(/\s+/)
                            .map(word => word[0].toUpperCase())
                            .join("") ?? '?'
                        }
                    </div>
                )}
                <h2 className="text-lg font-base text-[#333]">
                    {activeServer.name.trim().charAt(0).toUpperCase() +
                        activeServer.name.trim().slice(1)}
                </h2>
            </div>

            <div className="flex items-center my-2 w-full" role="separator" aria-label="or">
                <div className="flex-grow h-px bg-gray-600 opacity-35" />
            </div>

            {/* Channels */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {/* Text Channels */}
                <div className="mb-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium tracking-wide text-[#222831]">
                            Text Channels
                        </h3>
                        <button
                            onClick={() => setPopupCategory('text')}
                            className="p-1 rounded-lg hover:bg-[#dcd9d3] transition-colors"
                        >
                            <FaPlus className="text-[#555]" />
                        </button>
                    </div>
                    <ul>
                        {textChannels.map(channel => (
                            <li
                                key={channel.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#e7e7e9] cursor-pointer transition-colors text-[#73726e] hover:text-[#222831]"
                            >
                                {channel.type === 'text' ? <FaHashtag /> : <HiSpeakerWave />}
                                <span className="text-base font-base ">{channel.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Voice Channels */}
                <div>
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium tracking-wide text-[#222831]">
                            Voice Channels
                        </h3>
                        <button
                            onClick={() => setPopupCategory('voice')}
                            className="p-1 rounded-lg hover:bg-[#dcd9d3] transition-colors"
                        >
                            <FaPlus className="text-[#555]" />
                        </button>
                    </div>
                    <ul>
                        {voiceChannels.map(channel => (
                            <li
                                key={channel.id}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#e7e7e9] cursor-pointer transition-colors text-[#73726e] hover:text-[#222831]"
                            >
                                {channel.type === 'text' ? <FaHashtag /> : <HiSpeakerWave />}
                                <span className="text-base font-base">{channel.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Popup for the adding channel to the category */}
            {popupCategory && (
                <AddChannelPopup
                    isOpen={!!popupCategory}
                    onClose={() => setPopupCategory(null)}
                    onAddChannel={handleAddChannel}
                    category={popupCategory}
                />
            )}
        </div>
    );
}
