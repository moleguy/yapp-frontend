"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { useStoreHydration } from "@/app/hooks/useStoreHydration";
import {
    useMessagesForRoom,
    useFetchMessages,
    useAddMessage,
    useUpdateMessage,
    useDeleteMessage,
    useCanLoadOlderMessages,
    useFetchOlderMessages,
    useMessageLoading,
    useMessageStore,
} from "@/app/store/useMessageStore";
import {
    useAddReaction as useAddReactionStore,
    useRemoveReaction as useRemoveReactionStore,
} from "@/app/store/useReactionStore";
import { useSelectedRoom } from "@/app/store/useRoomStore";
import { useSelectedHallId } from "@/app/store/useHallStore";
import { useUser } from "@/app/store/useUserStore";
import { useWebSocket, useTypingIndicator } from "@/app/hooks/useWebSocket";
import {
    createMessage,
    deleteMessage,
    updateMessage,
    addReaction,
    removeReaction,
    Message,
} from "@/lib/api";

/**
 * ChatArea Component - Fully integrated with backend
 * 
 * Features:
 * - Real-time messaging via WebSocket
 * - Cursor-based pagination for message history
 * - Emoji reactions
 * - Message editing/deletion
 * - Typing indicators
 * - Optimistic updates
 */
export default function ChatArea() {
    // Ensure persisted stores are hydrated from localStorage
    useStoreHydration();

    const // Stores
        selectedRoom = useSelectedRoom();
    const selectedHallId = useSelectedHallId();
    const user = useUser();

    // Message store hooks
    const messages = useMessagesForRoom(selectedRoom?.id || "");
    const fetchMessages = useFetchMessages();
    const addMessageStore = useAddMessage();
    const updateMessageStore = useUpdateMessage();
    const deleteMessageStore = useDeleteMessage();
    const canLoadOlder = useCanLoadOlderMessages(selectedRoom?.id || "");
    const fetchOlder = useFetchOlderMessages();
    const loading = useMessageLoading();

    // Reaction store hooks
    const addReactionStore = useAddReactionStore();
    const removeReactionStore = useRemoveReactionStore();

    // WebSocket hook
    const { isConnected, sendMessage: sendWSMessage } = useWebSocket({
        roomId: selectedRoom?.id || null,
        hallId: selectedHallId || null,
        enabled: !!selectedRoom && !!selectedHallId,
    });

    // Typing indicator hook
    const { sendTypingIndicator } = useTypingIndicator(selectedRoom?.id || null);

    // Local state
    const [inputValue, setInputValue] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [sending, setSending] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ===== EFFECTS =====

    // Load messages when room changes
    useEffect(() => {
        if (!selectedRoom || !selectedHallId) return;

        const loadMessages = async () => {
            await fetchMessages(selectedHallId, selectedRoom.id, { limit: 50 });
        };

        loadMessages();
    }, [selectedRoom?.id, selectedHallId, fetchMessages]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, selectedRoom?.id]);

    // Handle scroll for pagination
    const handleScroll = useCallback(async () => {
        if (!scrollContainerRef.current) return;

        const { scrollTop } = scrollContainerRef.current;
        if (scrollTop < 100 && canLoadOlder) {
            await fetchOlder(selectedHallId!, selectedRoom!.id);
        }
    }, [canLoadOlder, fetchOlder, selectedHallId, selectedRoom]);

    // ===== HANDLERS =====

    const showError = (message: string) => {
        setErrorMessage(message);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
    };

    const handleSendMessage = async () => {
        if (!selectedRoom || !selectedHallId || !user || !inputValue.trim()) {
            return;
        }

        setSending(true);
        try {
            // Create message via API
            const newMessage = await createMessage(selectedHallId, selectedRoom.id, {
                content: inputValue.trim(),
            });

            if (newMessage) {
                // Add to store (optimistic, but confirmed by API)
                addMessageStore(selectedRoom.id, newMessage);
                setInputValue("");

                // Send via WebSocket to others
                if (isConnected) {
                    sendWSMessage(inputValue.trim());
                }
            } else {
                showError("Failed to send message");
            }
        } catch (err) {
            showError(
                err instanceof Error ? err.message : "Error sending message",
            );
        } finally {
            setSending(false);
        }
    };

    const handleEditMessage = async (messageId: string) => {
        if (!selectedRoom || !selectedHallId || !editingContent.trim()) {
            return;
        }

        try {
            const updated = await updateMessage(
                selectedHallId,
                selectedRoom.id,
                messageId,
                { content: editingContent.trim() },
            );

            if (updated) {
                updateMessageStore(selectedRoom.id, messageId, {
                    content: editingContent,
                    edited_at: new Date().toISOString(),
                });
                setEditingMessageId(null);
                setEditingContent("");
            } else {
                showError("Failed to edit message");
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : "Error editing message");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!selectedRoom || !selectedHallId) return;

        if (!confirm("Delete this message?")) return;

        try {
            const success = await deleteMessage(
                selectedHallId,
                selectedRoom.id,
                messageId,
            );

            if (success) {
                deleteMessageStore(selectedRoom.id, messageId);
            } else {
                showError("Failed to delete message");
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : "Error deleting message");
        }
    };

    const handleAddReaction = async (
        messageId: string,
        emoji: string,
    ) => {
        if (!selectedRoom || !selectedHallId || !user) return;

        try {
            const success = await addReaction(
                selectedHallId,
                selectedRoom.id,
                messageId,
                emoji,
            );

            if (success) {
                // Optimistic update
                const reaction = {
                    message_id: messageId,
                    user_id: user.id,
                    emoji,
                    created_at: new Date().toISOString(),
                };
                addReactionStore(selectedRoom.id, messageId, reaction);
            }
        } catch (err) {
            console.error("Error adding reaction:", err);
        }
    };

    const handleRemoveReaction = async (
        messageId: string,
        emoji: string,
    ) => {
        if (!selectedRoom || !selectedHallId || !user) return;

        try {
            const success = await removeReaction(
                selectedHallId,
                selectedRoom.id,
                messageId,
                emoji,
            );

            if (success) {
                removeReactionStore(
                    selectedRoom.id,
                    messageId,
                    user.id,
                    emoji,
                );
            }
        } catch (err) {
            console.error("Error removing reaction:", err);
        }
    };

    const handleInputChange = (text: string) => {
        setInputValue(text);
        // Send typing indicator (debounced)
        sendTypingIndicator();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ===== RENDER =====

    if (!selectedRoom) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
                <p className="text-gray-400">Select a room to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">
                    # {selectedRoom.name}
                </h2>
                {!isConnected && (
                    <p className="text-sm text-yellow-500">
                        ⚠ Connecting to real-time updates...
                    </p>
                )}
            </div>

            {/* Messages Container */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {/* Load older messages button */}
                {canLoadOlder && (
                    <button
                        onClick={() => fetchOlder(selectedHallId!, selectedRoom.id)}
                        disabled={loading}
                        className="w-full py-2 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-50"
                    >
                        {loading ? "Loading older messages..." : "Load older messages"}
                    </button>
                )}

                {/* Messages */}
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageItem
                            key={message.id}
                            message={message}
                            isOwnMessage={message.author_id === user?.id}
                            reactions={[]}
                            onEdit={() => {
                                setEditingMessageId(message.id);
                                setEditingContent(message.content);
                            }}
                            onDelete={() => handleDeleteMessage(message.id)}
                            onAddReaction={(emoji) =>
                                handleAddReaction(message.id, emoji)
                            }
                            onRemoveReaction={(emoji) =>
                                handleRemoveReaction(message.id, emoji)
                            }
                            isEditing={editingMessageId === message.id}
                            editingContent={editingContent}
                            onSaveEdit={(content) => {
                                setEditingContent(content);
                                handleEditMessage(message.id);
                            }}
                            onCancelEdit={() => {
                                setEditingMessageId(null);
                                setEditingContent("");
                            }}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error Toast */}
            {showErrorToast && (
                <div className="bg-red-900 text-red-200 px-4 py-2 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-700 p-4">
                <div className="flex gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Shift+Enter for newline)"
                        className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !inputValue.trim() || !isConnected}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition"
                    >
                        {sending ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== MESSAGE ITEM COMPONENT =====

interface MessageItemProps {
    message: Message;
    isOwnMessage: boolean;
    reactions: Array<{ emoji: string; message_id: string; user_id: string }>;
    onEdit: () => void;
    onDelete: () => void;
    onAddReaction: (emoji: string) => void;
    onRemoveReaction: (emoji: string) => void;
    isEditing: boolean;
    editingContent: string;
    onSaveEdit: (content: string) => void;
    onCancelEdit: () => void;
}

function MessageItem({
    message,
    isOwnMessage,
    reactions,
    onEdit,
    onDelete,
    onAddReaction,
    onRemoveReaction,
    isEditing,
    editingContent,
    onSaveEdit,
    onCancelEdit,
}: MessageItemProps) {
    const [showActions, setShowActions] = useState(false);

    // Count reactions by emoji
    const reactionCounts: Record<string, number> = {};
    reactions.forEach((r) => {
        if (r && typeof r === "object" && "emoji" in r) {
            const reaction = r as { emoji: string };
            reactionCounts[reaction.emoji] = (reactionCounts[reaction.emoji] || 0) + 1;
        }
    });

    return (
        <div
            className="group"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0" />

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Author</span>
                        <span className="text-xs text-gray-500">
                            {new Date(message.sent_at).toLocaleTimeString()}
                        </span>
                        {message.edited_at && (
                            <span className="text-xs text-gray-600">(edited)</span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2 mt-2">
                            <textarea
                                value={editingContent}
                                onChange={(e) => onSaveEdit(e.target.value)}
                                className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-sm"
                            />
                            <button
                                onClick={() => onSaveEdit(editingContent)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                            >
                                Save
                            </button>
                            <button
                                onClick={onCancelEdit}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-200 mt-1">{message.content}</p>
                    )}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {message.attachments.map((att) => (
                                <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline text-sm"
                                >
                                    📎 {att.file_name}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* Reactions */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                onClick={() => onRemoveReaction(emoji)}
                                className="bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1"
                            >
                                <span>{emoji}</span>
                                <span>{count}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => onAddReaction("👍")}
                            className="bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Message Actions */}
                {showActions && isOwnMessage && (
                    <div className="flex gap-1">
                        <button
                            onClick={onEdit}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-gray-400 hover:text-red-400 text-sm"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
