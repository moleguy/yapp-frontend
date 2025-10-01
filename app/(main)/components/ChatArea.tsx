"use client";

import React, { useState, useEffect, useRef } from "react";
import PollPopup from "@/app/(main)/components/PollPopup";
import { FiSend } from "react-icons/fi";
import { BiPoll } from "react-icons/bi";
import { FaPlus, FaUserPlus, FaHashtag } from "react-icons/fa6";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { MdOutlineGif } from "react-icons/md"; // gif icon
// import { useAuth } from "@/app/contexts/AuthContext";
import {useAvatar, useUser} from "@/app/store/useUserStore";
import Image from "next/image";

type Message = {
    id: string;
    sender: string;
    senderAvatar?: string;
    text: string;
    timestamp: Date;
    isSystem?: boolean;
    isWelcome?: boolean;
    isConsecutive?: boolean;
};

type ChatAreaProps = {
    serverName?: string;
    channelName?: string;
    channelId?: string;
    friendDisplayName?: string;
    friendUsername?: string;
    friendId?: string;
    friendAvatar?: string;
    isDm: boolean;
};

export default function ChatArea({
                                     serverName,
                                     channelName,
                                     channelId,
                                     friendDisplayName,
                                     friendUsername,
                                     friendId,
                                     friendAvatar,
                                     isDm = false,
                                 }: ChatAreaProps) {
    // const { user } = useAuth();
    const user = useUser();
    const {avatarUrl, avatarThumbnailUrl, fallback, hasAvatar} = useAvatar();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const uploadRef = useRef<HTMLDivElement | null>(null);

    const [messageInput, setMessageInput] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showPollPopup, setShowPollPopup] = useState(false);
    const [showInvitePopup, setShowInvitePopup] = useState(false);

    // Separate state for actual messages (user messages)
    const [messages, setMessages] = useState<Message[]>([]);

    // Separate welcome message that can be easily modified
    const [welcomeMessage, setWelcomeMessage] = useState<Message | null>(null);

    // Generate welcome message based on context
    const generateWelcomeMessage = (): Message | null => {
        if (isDm && friendDisplayName) {
            return {
                id: "welcome-dm",
                sender: "System",
                text: `This is the beginning of your direct message history with **${friendDisplayName}**.`,
                timestamp: new Date(),
                isSystem: true,
                isWelcome: true,
            };
        } else if (channelName && serverName) {
            return {
                id: "welcome-channel",
                sender: "System",
                text: `Welcome to **${serverName}**. This is the beginning of the **#${channelName}** channel.`,
                timestamp: new Date(),
                isSystem: true,
                isWelcome: true,
            };
        }
        return null;
    };

    // Initialize or update welcome message when context changes
    useEffect(() => {
        const newWelcomeMessage = generateWelcomeMessage();
        setWelcomeMessage(newWelcomeMessage);
        setMessages([]); // Clear user messages when context changes
        setMessageInput("");
    }, [isDm, channelId, friendId, serverName, channelName, friendDisplayName]);

    // combining welcome message with user messages for rendering
    const allMessages = welcomeMessage ? [welcomeMessage, ...messages] : messages;

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [allMessages]);

    const sendMessage = () => {
        if (!messageInput.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: user?.display_name || "Unknown",
            text: messageInput.trim(),
            timestamp: new Date(),

            isConsecutive: messages.length > 0 &&
                messages[messages.length -1].sender === (user?.display_name || "Unknown") &&
                !messages[messages.length-1].isSystem &&
                !messages[messages.length -1].isWelcome
        };

        setMessages(prev => [...prev, newMessage]);
        setMessageInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleCreatePoll = (question: string, options: string[]) => {
        console.log("Poll created:", { question, options });
    };

    const handleCreateInvite = (expiry: string, maxUses: number) => {
        console.log("Invite created:", { expiry, maxUses });
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `https://discord.gg/${inviteCode}`;
    };

    // Close popup when clicking outside
    useEffect(() => {
        if (!showPopup) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (uploadRef.current && uploadRef.current.contains(e.target as Node)) {
                return;
            }
            setShowPopup(false);
        };
        window.addEventListener("mousedown", handleClickOutside);

        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [showPopup]);

    // Format date like Discord (Today at HH:MM)
    const formatDate = (date: Date) => {
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString([], {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) + ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Function to update welcome message (example of how you can modify it)
    const updateWelcomeMessage = (newText: string) => {
        if (welcomeMessage) {
            setWelcomeMessage({
                ...welcomeMessage,
                text: newText,
                timestamp: new Date(),
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="flex-1 flex flex-col-reverse overflow-y-auto min-h-0 bg-[#fbfbfb]">
                <div className="p-4">
                    <div className="space-y-0.5">
                        {allMessages.map((msg, index) => (
                            <div
                                key={msg.id}
                                className={`group relative ${msg.isSystem ? 'justify-center' : ''}`}
                            >
                                <div className={`flex gap-4 items-start group-hover:bg-[#eeeeef] rounded-lg px-2 transition-colors ${msg.isSystem ? 'flex items-start' : ''}`}>
                                {!msg.isSystem && !msg.isConsecutive && (
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-start overflow-hidden">
                                            {avatarThumbnailUrl ? (
                                                <Image
                                                    src={avatarThumbnailUrl}
                                                    alt={msg.sender}
                                                    width={124}
                                                    height={124}
                                                    className="object-cover cursor-pointer"
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-600">
                                                    {msg.sender.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {!msg.isSystem && msg.isConsecutive && (
                                        <div className="flex-shrink-0 w-10 h-10"></div>
                                    )}

                                    <div className={`flex-1 min-w-0 ${msg.isSystem ? 'text-center w-full mx-auto' : 'max-w-full'}`}>
                                        {!msg.isSystem && !msg.isConsecutive && (
                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-1">
                                                <span className="font-semibold text-[#1e1f22] break-words hover:underline cursor-pointer flex-shrink-0">
                                                    {msg.sender}
                                                </span>
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {formatDate(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}

                                        {/* for consecutive messages, timestamp on hover */}
                                        {!msg.isSystem && msg.isConsecutive && (
                                            <div className="absolute left-14 -translate-x-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs text-gray-500">
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </span>
                                            </div>
                                        )}

                                        <div className={` ${msg.isSystem ? 'w-full' : 'text-[#2e2f32]'}`}>
                                            {msg.isSystem ? (
                                                <div className="break-words w-full">
                                                    {!isDm && serverName && channelName && (
                                                        <div className="w-full">
                                                            {/* server welcome content */}
                                                        </div>
                                                    )}
                                                    {isDm && friendDisplayName && (
                                                        <div className="w-full text-start">
                                                            {/* DM welcome content */}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[15px] text-[#1e1e1e] leading-relaxed break-words whitespace-pre-wrap overflow-hidden py-0.5">
                                                    {msg.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input area */}
            <div className="p-4 bg-[#fbfbfb]">
                <div className="relative">
                    <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer">
                        <FaPlus
                            onClick={() => setShowPopup(!showPopup)}
                            className="w-7 h-7 hover:bg-gray-100 rounded p-1"
                        />
                    </button>

                    {/* file or poll popup */}
                    {showPopup && (
                        <div
                            ref={uploadRef}
                            className="absolute bottom-12 left-0 bg-white border border-gray-300 rounded-lg shadow-lg w-48 p-2 z-10"
                        >
                            <button
                                className="flex items-center gap-2 text-gray-700 w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm font-medium cursor-pointer"
                                onClick={() => {
                                    setShowPopup(false);
                                    console.log("Upload File clicked");
                                }}
                            >
                                <MdOutlineDriveFolderUpload className="w-4 h-4" />
                                Upload File
                            </button>
                            <button
                                className="flex items-center gap-2 text-gray-700 w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm font-medium cursor-pointer"
                                onClick={() => {
                                    setShowPopup(false);
                                    setShowPollPopup(true);
                                }}
                            >
                                <BiPoll className="w-4 h-4" />
                                Create Poll
                            </button>
                        </div>
                    )}

                    {showPollPopup && (
                        <PollPopup
                            onClose={() => setShowPollPopup(false)}
                            onCreate={handleCreatePoll}
                        />
                    )}

                    {/*{showInvitePopup && (*/}
                    {/*    <InvitePopup*/}
                    {/*        onClose={() => setShowInvitePopup(false)}*/}
                    {/*        onCreate={handleCreateInvite}*/}
                    {/*        serverName={serverName || ""}*/}
                    {/*    />*/}
                    {/*)}*/}

                    {/* Input */}
                    <input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isDm
                                ? `Message @${friendDisplayName}`
                                : channelName
                                    ? `Message #${channelName}`
                                    : "Message"
                        }
                        className="w-full pl-12 pr-12 py-4 rounded-lg border border-[#dcd9d3] focus:outline-none bg-[#ffffff] tracking-wide text-[#222831]"
                    />

                    {/* send button */}
                    <button
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSend size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}