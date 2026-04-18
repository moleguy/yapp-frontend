"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PollPopup from "@/app/(main)/components/PollPopup";
import { FiSend } from "react-icons/fi";
import { BiPoll } from "react-icons/bi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
// import { useAuth } from "@/app/contexts/AuthContext";
import { useAvatar, useUser } from "@/app/store/useUserStore";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import { useMessagesForRoom, useFetchMessages, useAddOptimisticMessage } from "@/app/store/useMessageStore";
import Image from "next/image";
import {
    getMessages,
    Message as ApiMessage,
    getWebSocketUrl,
    WSMessage,
    WSTextMessage,
    getHallMembers,
    HallMember,
    createMessage
} from "@/lib/api";

type Message = {
    id: string;
    sender: string;
    senderAvatar?: string;
    text: string;
    timestamp: Date;
    isSystem?: boolean;
    isWelcome?: boolean;
    isConsecutive?: boolean;
    isOptimistic?: boolean;
    hasError?: boolean;
};

type ChatAreaProps = {
    serverName?: string;
    channelName?: string;
    hallId?: string;
    roomId?: string;
    friendDisplayName?: string;
    friendId?: string;
    isDm: boolean;
    onToggleRightSidebar?: () => void;
    isRightSidebarCollapsed?: boolean;
};

export default function ChatArea({
    serverName,
    channelName,
    hallId,
    roomId,
    friendDisplayName,
    friendId,
    isDm = false,
    onToggleRightSidebar,
    isRightSidebarCollapsed,
}: ChatAreaProps) {
    // const { user } = useAuth();
    const user = useUser();
    const { avatarThumbnailUrl } = useAvatar();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const uploadRef = useRef<HTMLDivElement | null>(null);

    const [messageInput, setMessageInput] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showPollPopup, setShowPollPopup] = useState(false);

    // Get messages from store
    const storeMessages = useMessagesForRoom(roomId || "");
    const fetchMessages = useFetchMessages();
    const addOptimisticMessage = useAddOptimisticMessage();

    const {
        isConnected,
        sendMessage: sendWsMessage,
        sendTyping,
        sendStopTyping,
        getTypingUsers
    } = useWebSocket({
        roomId: roomId || null,
        hallId: hallId || null,
        enabled: !isDm && !!roomId && !!hallId
    });

    const typingUsersList = getTypingUsers();

    const [members, setMembers] = useState<Record<string, { username: string; displayName: string; avatarUrl?: string }>>({});

    // Map store messages to local Message format for rendering
    const messages = useMemo<Message[]>(() => {
        return storeMessages.map((m, index, array) => {
            const authorInfo = members[m.author_id];
            return {
                id: m.id,
                sender: authorInfo?.displayName || m.author?.display_name || m.author?.username || m.author_id,
                senderAvatar: authorInfo?.avatarUrl || m.author?.avatar_thumbnail_url || undefined,
                text: m.content,
                timestamp: new Date(m.sent_at),
                isConsecutive: index > 0 && array[index - 1].author_id === m.author_id,
                isSystem: false,
                isOptimistic: m.isOptimistic
            };
        });
    }, [storeMessages, members]);

    // Separate welcome message that can be easily modified
    const [welcomeMessage, setWelcomeMessage] = useState<Message | null>(null);

    // Generate welcome message based on context
    const generateWelcomeMessage = useCallback((): Message | null => {
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
    }, [isDm, friendDisplayName, channelName, serverName]);

    // Initialize or update welcome message when context changes
    useEffect(() => {
        const newWelcomeMessage = generateWelcomeMessage();
        setWelcomeMessage(newWelcomeMessage);
        setMessageInput("");

        // Fetch hall members for name/avatar mapping
        if (hallId) {
            getHallMembers(hallId).then(res => {
                if (res && res.members) {
                    const memberMap: Record<string, { username: string; displayName: string; avatarUrl?: string }> = {};
                    res.members.forEach(m => {
                        memberMap[m.user_id] = {
                            username: m.user?.username || m.user_id,
                            displayName: m.nickname || m.user?.display_name || m.user?.username || m.user_id,
                            avatarUrl: m.user?.avatar_thumbnail_url ?? undefined
                        };
                    });
                    setMembers(memberMap);
                }
            });
        }

        // Fetch messages from backend if it's a room
        if (!isDm && hallId && roomId) {
            fetchMessages(hallId, roomId);
        }
    }, [isDm, roomId, hallId, friendId, serverName, channelName, friendDisplayName, generateWelcomeMessage, fetchMessages]);

    // Handle incoming messages from store or hook
    // Actually the useWebSocket hook updates the message store.
    // ChatArea currently uses local state for messages. Let's keep it simple for now and sync with hook's callbacks if possible,
    // or just use the hook's returned state if we refactor more.
    // For now, I'll modify useWebSocket to accept an onMessage callback or similar.
    // Wait, useWebSocket already calls addMessage(roomId, message).
    // Let's make ChatArea listen to the store.

    // combining welcome message with user messages for rendering
    const allMessages = useMemo(() => {
        return welcomeMessage ? [welcomeMessage, ...messages] : messages;
    }, [welcomeMessage, messages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [allMessages]);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);

        if (!isDm && roomId && isConnected) {
            // Send typing indicator via hook
            sendTyping();

            // Clear previous timeout
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            // Set timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                sendStopTyping();
            }, 3000);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim()) return;

        const content = messageInput.trim();
        setMessageInput("");

        if (!isDm && roomId && isConnected && user) {
            // Optimistic Update
            const tempId = `temp-${Date.now()}`;
            const optimisticMsg: ApiMessage = {
                id: tempId,
                room_id: roomId,
                author_id: user.id,
                content: content,
                sent_at: new Date().toISOString(),
                edited_at: null,
                deleted_at: null,
                author: user as any, // Cast to avoid full user object mismatch
            };

            addOptimisticMessage(roomId, optimisticMsg);
            sendWsMessage(content);
        } else if (isDm && friendId && roomId && hallId) {
            // REST fallback for DMs (or if WS is preferred, but docs say REST POST /messages doesn't exist)
            // Wait, api(updated).md says "Text messages are NOT created via REST... All message creation flows exclusively through the WebSocket connection."
            // But it also says "/api/v1/halls/:hallID/rooms/:roomID/messages" GET exists.
            // If DMs are also in rooms, they should use WS.
            // Let's stick to WS if possible.
            if (isConnected) {
                sendWsMessage(content);
            } else {
                // Fallback to REST if WS not connected and if it existed.
                // Since docs say it doesn't, we might need to handle this.
                // For now, let's assume DMs also use WS rooms.
                console.error("WebSocket is not connected for DM");
            }
        } else if (!isDm) {
            console.error("WebSocket is not connected");
        }
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

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="flex-1 mt-14 flex flex-col-reverse overflow-y-auto min-h-0 bg-[#fbfbfb]">
                <div className={`absolute top-0 py-3 px-8 w-full bg-[#fbfbfb] border-b border-[#dcd9d3] flex items-center justify-between z-10`}>
                    <span className="font-semibold text-lg text-[#1e1e1e]">
                        {isDm
                            ? `${friendDisplayName}`
                            : channelName
                                ? `#${channelName}`
                                : "Message"}
                    </span>
                    {onToggleRightSidebar && (
                        <button
                            onClick={onToggleRightSidebar}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                            title={isRightSidebarCollapsed ? "Show Member List" : "Hide Member List"}
                        >
                            {isRightSidebarCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
                        </button>
                    )}
                </div>
                <div className="p-4">
                    <div className="space-y-0.5">
                        {allMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`group relative ${msg.isSystem ? 'justify-center' : ''}`}
                            >
                                <div className={`flex gap-4 items-start group-hover:bg-[#eeeeef] rounded-lg px-2 transition-colors ${msg.isSystem ? 'flex items-start' : ''} ${msg.isOptimistic ? 'opacity-70' : ''} ${msg.hasError ? 'text-red-500' : ''}`}>
                                    {!msg.isSystem && !msg.isConsecutive && (
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-start overflow-hidden">
                                            {msg.senderAvatar || avatarThumbnailUrl ? (
                                                <Image
                                                    src={msg.senderAvatar || avatarThumbnailUrl || ""}
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
                        {typingUsersList.length > 0 && (
                            <div className="text-xs text-gray-500 italic ml-14">
                                {typingUsersList.length === 1
                                    ? `${members[typingUsersList[0]]?.displayName || typingUsersList[0]} is typing...`
                                    : "Several people are typing..."}
                            </div>
                        )}
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
                        onChange={handleInputChange}
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