"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSend, FiEdit2, FiTrash2, FiSmile } from "react-icons/fi";
import { useUser } from "@/app/store/useUserStore";
import { useWebSocket, useTypingIndicator } from "@/app/hooks/useWebSocket";
import {
  useMessagesForRoom,
  useFetchMessages,
} from "@/app/store/useMessageStore";
import { useReactionCounts, useReactionStore } from "@/app/store/useReactionStore";
import { resolveMessageAuthor } from "@/lib/messageUtils";
import { Message } from "@/lib/api";
import { useHallMembers } from "@/app/store/useHallStore";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

type ChatAreaProps = {
  serverName?: string;
  channelName?: string;
  hallId?: string;
  roomId?: string;
  friendDisplayName?: string;
  friendId?: string;
  isDm: boolean;
};

function MessageReactions({
  roomId,
  messageId,
  userId,
  onReact,
}: {
  roomId: string;
  messageId: string;
  userId: string;
  onReact: (emoji: string, action: "add" | "remove") => void;
}) {
  const counts = useReactionCounts(roomId, messageId);
  const userReactedWith = useReactionStore((s) => s.userReactedWith);
  const emojis = Object.keys(counts);

  if (emojis.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {emojis.map((emoji) => {
        const reacted = userReactedWith(roomId, messageId, userId, emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji, reacted ? "remove" : "add")}
            className={`text-xs px-2 py-0.5 rounded-full border ${
              reacted ? "bg-blue-100 border-blue-300" : "bg-gray-50 border-gray-200"
            }`}
          >
            {emoji} {counts[emoji]}
          </button>
        );
      })}
    </div>
  );
}

export default function ChatArea({
  hallId,
  roomId,
  isDm,
}: ChatAreaProps) {
  const user = useUser();
  const hallMembers = useHallMembers();
  const safeHallId = hallId || "";
  const safeRoomId = roomId || "";
  const messages = useMessagesForRoom(safeRoomId);
  const fetchMessages = useFetchMessages();
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<string | null>(null);

  const {
    sendMessage,
    sendEdit,
    sendDelete,
    sendReact,
    sendRead,
    typingUsers,
  } = useWebSocket({
    hallId: safeHallId || null,
    roomId: safeRoomId || null,
    enabled: !!safeHallId && !!safeRoomId && !isDm,
  });

  const { sendTypingIndicator } = useTypingIndicator(
    !isDm && safeRoomId ? safeRoomId : null
  );

  useEffect(() => {
    if (!safeHallId || !safeRoomId || isDm) return;
    fetchMessages(safeHallId, safeRoomId);
  }, [safeHallId, safeRoomId, isDm, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!safeRoomId || messages.length === 0 || isDm) return;
    const latest = messages[messages.length - 1];
    if (latest.id && latest.id !== lastReadRef.current && !latest.isOptimistic) {
      lastReadRef.current = latest.id;
      sendRead(latest.id);
    }
  }, [messages, safeRoomId, isDm, sendRead]);

  const formatTime = (t?: string) =>
    t
      ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  const handleSend = () => {
    if (!input.trim() || !safeRoomId) return;
    sendMessage(input.trim());
    setInput("");
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditContent(m.content);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await sendEdit(editingId, editContent.trim());
    setEditingId(null);
    setEditContent("");
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Delete this message?")) return;
    await sendDelete(messageId);
  };

  const handleReact = async (messageId: string, emoji: string, action: "add" | "remove") => {
    await sendReact(messageId, emoji, action);
    setReactionPickerId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => {
          const isCurrentUser = m.author_id === user?.id;
          const isEditing = editingId === m.id;
          const { displayName, username } = resolveMessageAuthor(m, user, hallMembers);

          return (
            <div
              key={m.id}
              className={`mb-3 group ${isCurrentUser ? "flex justify-end" : "flex justify-start"}`}
            >
              <div className={`max-w-[70%] ${isCurrentUser ? "text-right" : "text-left"}`}>
                <div
                  className={`flex gap-2 text-sm text-gray-600 mb-1 items-center ${
                    isCurrentUser ? "justify-end" : ""
                  }`}
                >
                  {!isCurrentUser && (
                    <span
                      className="font-semibold cursor-default"
                      title={username ? `@${username}` : undefined}
                    >
                      {displayName}
                    </span>
                  )}
                  <span>{formatTime(m.sent_at)}</span>
                  {isCurrentUser && !m.isOptimistic && (
                    <span className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button type="button" onClick={() => startEdit(m)} title="Edit">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(m.id)} title="Delete">
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReactionPickerId(reactionPickerId === m.id ? null : m.id)
                        }
                        title="React"
                      >
                        <FiSmile className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border px-2 py-1 rounded text-sm"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                    <button type="button" onClick={saveEdit} className="text-sm text-blue-600">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`text-gray-900 ${
                      isCurrentUser
                        ? "bg-blue-100 rounded-l-lg rounded-tr-lg px-3 py-2 inline-block"
                        : "bg-gray-100 rounded-r-lg rounded-tl-lg px-3 py-2 inline-block"
                    }`}
                  >
                    {m.content}
                  </div>
                )}

                {reactionPickerId === m.id && user && (
                  <div className="flex gap-1 mt-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="text-lg hover:scale-110 transition"
                        onClick={() => handleReact(m.id, emoji, "add")}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {user && (
                  <MessageReactions
                    roomId={safeRoomId}
                    messageId={m.id}
                    userId={user.id}
                    onReact={(emoji, action) => handleReact(m.id, emoji, action)}
                  />
                )}

                {m.isOptimistic && (
                  <span className="text-xs text-gray-400 ml-2">sending...</span>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="text-xs italic text-gray-400">
            {typingUsers.length === 1 ? "Someone is typing..." : "Several people are typing..."}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            sendTypingIndicator();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend} className="px-3 bg-blue-700 text-white rounded">
          <FiSend />
        </button>
      </div>
    </div>
  );
}
