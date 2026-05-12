"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import PollPopup from "@/app/(main)/components/PollPopup";
import { FiSend, FiEdit2, FiTrash2 } from "react-icons/fi";
import { BiPoll, BiSmile } from "react-icons/bi";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { PanelRightClose, PanelRightOpen, Check, X } from "lucide-react";
import { useAvatar, useUser } from "@/app/store/useUserStore";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
    useMessagesForRoom,
    useFetchMessages,
    useAddOptimisticMessage,
    useUpdateMessage,
    useDeleteMessage
} from "@/app/store/useMessageStore";
import {
    useAddReaction,
    useRemoveReaction,
    useReactionsForMessage
} from "@/app/store/useReactionStore";
import Image from "next/image";
import {
    Message as ApiMessage,
    getHallMembers,
    updateMessage as apiUpdateMessage,
    deleteMessage as apiDeleteMessage,
    addReaction as apiAddReaction,
    removeReaction as apiRemoveReaction,
    UserMeRes,
} from "@/lib/api";

type Message = {
    id: string;
    author_id?: string;
    sender: string;
    senderAvatar?: string;
    text: string;
    timestamp: Date;
    isSystem?: boolean;
    isWelcome?: boolean;
    isConsecutive?: boolean;
    isOptimistic?: boolean;
    hasError?: boolean;
    edited_at?: string | null;
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
    const user = useUser();
    const { avatarThumbnailUrl } = useAvatar();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const uploadRef = useRef<HTMLDivElement | null>(null);

    const [messageInput, setMessageInput] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [showPollPopup, setShowPollPopup] = useState(false);

    // Optimized Store Selectors
    const storeMessages = useMessagesForRoom(roomId || "");
    const fetchMessages = useFetchMessages();
    const addOptimisticMessage = useAddOptimisticMessage();
    const updateMessageStore = useUpdateMessage();
    const deleteMessageStore = useDeleteMessage();

    const addReactionStore = useAddReaction();
    const removeReactionStore = useRemoveReaction();

    const {
        isConnected,
        sendMessage: sendWsMessage,
        sendTyping,
        sendStopTyping,
        getTypingUsers,
        sendRead
    } = useWebSocket({
        roomId: roomId || null,
        hallId: hallId || null,
        enabled: !isDm && !!roomId && !!hallId
    });

    const typingUsersList = getTypingUsers();
    const [members, setMembers] = useState<Record<string, any>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    // 1. Stable Welcome Message
    const welcomeMessage = useMemo<Message | null>(() => {
        const base = { timestamp: new Date(0), isSystem: true, isWelcome: true };
        if (isDm && friendDisplayName) {
            return { ...base, id: "welcome-dm", sender: "System", text: `This is the start of your DM history with **${friendDisplayName}**.` };
        } else if (channelName && serverName) {
            return { ...base, id: "welcome-channel", sender: "System", text: `Welcome to **${serverName}**. This is the start of **#${channelName}**.` };
        }
        return null;
    }, [isDm, friendDisplayName, channelName, serverName]);

    // 2. Optimized Fetching
    useEffect(() => {
        if (!hallId) return;

        // Fetch members
        getHallMembers(hallId).then(res => {
            if (res?.members) {
                const memberMap: Record<string, any> = {};
                res.members.forEach(m => {
                    memberMap[m.user_id] = {
                        displayName: m.nickname || m.user?.display_name || m.user?.username || m.user_id,
                        avatarUrl: m.user?.avatar_thumbnail_url
                    };
                });
                setMembers(memberMap);
            }
        });

        // Fetch messages
        if (!isDm && roomId) {
            fetchMessages(hallId, roomId);
        }

        setMessageInput(""); // Reset input on room change
    }, [hallId, roomId, isDm, fetchMessages]);

    // 3. Memoized Message Mapping
    const messages = useMemo<Message[]>(() => {
        return storeMessages.map((m, index, array) => {
            const authorInfo = members[m.author_id];
            return {
                id: m.id,
                author_id: m.author_id,
                sender: authorInfo?.displayName || m.author?.display_name || m.author?.username || m.author_id,
                senderAvatar: authorInfo?.avatarUrl || m.author?.avatar_thumbnail_url || undefined,
                text: m.content,
                timestamp: new Date(m.sent_at),
                isConsecutive: index > 0 && array[index - 1].author_id === m.author_id,
                isSystem: false,
                isOptimistic: m.isOptimistic,
                edited_at: m.edited_at
            };
        });
    }, [storeMessages, members]);

    const allMessages = useMemo(() => {
        return welcomeMessage ? [welcomeMessage, ...messages] : messages;
    }, [welcomeMessage, messages]);

    // 4. Smooth Scrolling (Delayed slightly to ensure DOM is ready)
    useEffect(() => {
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [allMessages.length]);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!isDm && roomId && isConnected) {
            sendTyping();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => sendStopTyping(), 3000);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !user) return;
        const content = messageInput.trim();
        setMessageInput("");

        if (roomId && isConnected) {
            const tempId = `temp-${Date.now()}`;
            const optimisticMsg: ApiMessage = {
                id: tempId,
                room_id: roomId,
                author_id: user.id,
                content: content,
                sent_at: new Date().toISOString(),
                edited_at: null,
                deleted_at: null,
                author: user as any,
            };
            addOptimisticMessage(roomId, optimisticMsg);
            sendWsMessage(content);
        }
    };

    const handleUpdateMessage = async (msgId: string) => {
        if (!editValue.trim() || !hallId || !roomId) return;
        const newContent = editValue.trim();

        try {
            const updated = await apiUpdateMessage(hallId, roomId, msgId, { content: newContent });
            if (updated) {
                updateMessageStore(roomId, msgId, { content: newContent, edited_at: new Date().toISOString() });
            }
        } catch (err) {
            console.error("Failed to update message", err);
        } finally {
            setEditingId(null);
            setEditValue("");
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!hallId || !roomId || !confirm("Are you sure you want to delete this message?")) return;

        try {
            const success = await apiDeleteMessage(hallId, roomId, msgId);
            if (success) {
                deleteMessageStore(roomId, msgId);
            }
        } catch (err) {
            console.error("Failed to delete message", err);
        }
    };

    const handleAddReaction = async (msgId: string, emoji: string) => {
        if (!hallId || !roomId || !user) return;

        try {
            const success = await apiAddReaction(hallId, roomId, msgId, emoji);
            if (success) {
                addReactionStore(roomId, msgId, {
                    message_id: msgId,
                    user_id: user.id,
                    emoji,
                    created_at: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error("Failed to add reaction", err);
        }
    };

    const handleRemoveReaction = async (msgId: string, emoji: string) => {
        if (!hallId || !roomId || !user) return;

        try {
            const success = await apiRemoveReaction(hallId, roomId, msgId, emoji);
            if (success) {
                removeReactionStore(roomId, msgId, user.id, emoji);
            }
        } catch (err) {
            console.error("Failed to remove reaction", err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") { e.preventDefault(); sendMessage(); }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        if (date.getTime() === 0) return ""; // Hide for system welcome
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return isToday ? `Today at ${timeStr}` : `${date.toLocaleDateString()} at ${timeStr}`;
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <div className="flex-1 mt-14 flex flex-col-reverse overflow-y-auto min-h-0 bg-[#fbfbfb]">
                {/* Header */}
                <div className="absolute top-0 py-3 px-8 w-full bg-[#fbfbfb] border-b border-[#dcd9d3] flex items-center justify-between z-10">
                    <span className="font-semibold text-lg text-[#1e1e1e]">
                        {isDm ? friendDisplayName : channelName ? `#${channelName}` : "Message"}
                    </span>
                    {onToggleRightSidebar && (
                        <button onClick={onToggleRightSidebar} className="p-2 hover:bg-gray-200 rounded-lg text-gray-600">
                            {isRightSidebarCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
                        </button>
                    )}
                </div>

                {/* Message List */}
                <div className="p-4">
                    <div className="space-y-0.5">
                        {allMessages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                msg={msg}
                                user={user}
                                roomId={roomId}
                                members={members}
                                avatarThumbnailUrl={avatarThumbnailUrl}
                                formatDate={formatDate}
                                isEditing={editingId === msg.id}
                                editValue={editValue}
                                setEditValue={setEditValue}
                                onStartEdit={() => {
                                    setEditingId(msg.id);
                                    setEditValue(msg.text);
                                }}
                                onCancelEdit={() => {
                                    setEditingId(null);
                                    setEditValue("");
                                }}
                                onUpdate={handleUpdateMessage}
                                onDelete={handleDeleteMessage}
                                onAddReaction={handleAddReaction}
                                onRemoveReaction={handleRemoveReaction}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                        {typingUsersList.length > 0 && (
                            <div className="text-xs text-gray-500 italic ml-14 animate-pulse">
                                {typingUsersList.length === 1 ? `${members[typingUsersList[0]]?.displayName || "Someone"} is typing...` : "Several people are typing..."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="p-4 bg-[#fbfbfb]">
                <div className="relative">
                    <button onClick={() => setShowPopup(!showPopup)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        <FaPlus className="w-6 h-6" />
                    </button>
                    <input
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isDm ? `Message @${friendDisplayName}` : `# Message channel`}
                        className="w-full pl-12 pr-12 py-3 rounded-lg border border-[#dcd9d3] focus:outline-none bg-white"
                    />
                    <button onClick={sendMessage} disabled={!messageInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 disabled:opacity-30">
                        <FiSend size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE ITEM COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface MessageItemProps {
    msg: Message;
    user: UserMeRes | null;
    roomId?: string;
    members: Record<string, any>;
    avatarThumbnailUrl: string | null;
    formatDate: (d: Date) => string;
    isEditing: boolean;
    editValue: string;
    setEditValue: (v: string) => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
    onAddReaction: (id: string, emoji: string) => void;
    onRemoveReaction: (id: string, emoji: string) => void;
}

function MessageItem({
    msg,
    user,
    roomId,
    members,
    avatarThumbnailUrl,
    formatDate,
    isEditing,
    editValue,
    setEditValue,
    onStartEdit,
    onCancelEdit,
    onUpdate,
    onDelete,
    onAddReaction,
    onRemoveReaction
}: MessageItemProps) {
    const isOwn = user?.id === msg.author_id || msg.sender === user?.username || msg.sender === user?.display_name;
    const reactions = useReactionsForMessage(roomId || "", msg.id);

    // Count reactions
    const reactionCounts: Record<string, { count: number; userHasReacted: boolean }> = {};
    reactions.forEach(r => {
        if (!reactionCounts[r.emoji]) {
            reactionCounts[r.emoji] = { count: 0, userHasReacted: false };
        }
        reactionCounts[r.emoji].count++;
        if (r.user_id === user?.id) {
            reactionCounts[r.emoji].userHasReacted = true;
        }
    });

    return (
        <div className={`group relative ${msg.isSystem ? 'py-8' : ''}`}>
            {/* Actions overlay */}
            {!msg.isSystem && !isEditing && (
                <div className="absolute right-4 top-0 -translate-y-1/2 hidden group-hover:flex items-center bg-white border border-[#dcd9d3] rounded-lg shadow-sm z-10 px-1 py-1 gap-1">
                    <button
                        onClick={() => onAddReaction(msg.id, "👍")}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                        title="Add Reaction"
                    >
                        <BiSmile size={18} />
                    </button>
                    {isOwn && (
                        <>
                            <button
                                onClick={onStartEdit}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                                title="Edit"
                            >
                                <FiEdit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(msg.id)}
                                className="p-1.5 hover:bg-gray-100 rounded text-red-500 transition-colors"
                                title="Delete"
                            >
                                <FiTrash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className={`flex gap-4 items-start group-hover:bg-[#eeeeef] rounded-lg px-2 py-0.5 transition-colors ${msg.isOptimistic ? 'opacity-70' : ''}`}>
                {!msg.isSystem && !msg.isConsecutive && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 overflow-hidden mt-1">
                        {msg.senderAvatar || avatarThumbnailUrl ? (
                            <Image src={msg.senderAvatar || avatarThumbnailUrl || ""} alt="" width={40} height={40} className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                                {msg.sender.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}
                {!msg.isSystem && msg.isConsecutive && <div className="w-10 flex-shrink-0" />}

                <div className="flex-1 min-w-0">
                    {!msg.isSystem && !msg.isConsecutive && (
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-[#1e1f22] hover:underline cursor-pointer">{msg.sender}</span>
                            <span className="text-xs text-gray-500">{formatDate(msg.timestamp)}</span>
                        </div>
                    )}

                    <div className={msg.isSystem ? "text-center py-4 border-b border-gray-100 mb-4" : "text-[#2e2f32]"}>
                        {isEditing ? (
                            <div className="mt-1">
                                <div className="bg-white border border-[#dcd9d3] rounded-lg overflow-hidden">
                                    <input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") onUpdate(msg.id);
                                            if (e.key === "Escape") onCancelEdit();
                                        }}
                                        autoFocus
                                        className="w-full px-3 py-2 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 mt-1.5">
                                    <button
                                        onClick={() => onUpdate(msg.id)}
                                        className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                        <Check size={14} /> Save
                                    </button>
                                    <button
                                        onClick={onCancelEdit}
                                        className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${msg.isSystem ? 'text-gray-500 italic' : 'text-[#1e1e1e]'}`}>
                                {msg.text}
                                {msg.edited_at && !msg.isSystem && (
                                    <span className="text-[10px] text-gray-400 ml-1">(edited)</span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Reactions Display */}
                    {!msg.isSystem && Object.keys(reactionCounts).length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                            {Object.entries(reactionCounts).map(([emoji, { count, userHasReacted }]) => (
                                <button
                                    key={emoji}
                                    onClick={() => userHasReacted ? onRemoveReaction(msg.id, emoji) : onAddReaction(msg.id, emoji)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-sm transition-colors ${
                                        userHasReacted
                                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                                            : 'bg-white border-[#dcd9d3] text-gray-600 hover:border-gray-400'
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span className="font-semibold text-xs">{count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}