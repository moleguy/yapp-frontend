"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "@/app/store/useUserStore";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
  useMessagesForRoom,
  useFetchMessages,
} from "@/app/store/useMessageStore";

type ChatAreaProps = {
  serverName?: string;
  channelName?: string;

  hallId?: string;
  roomId?: string;

  friendDisplayName?: string;
  friendId?: string;

  isDm: boolean;
};

export default function ChatArea({
  hallId,
  roomId,
  isDm,
}: ChatAreaProps) {
  const user = useUser();

  const safeHallId = hallId || "";
  const safeRoomId = roomId || "";

  const messages = useMessagesForRoom(safeRoomId);
  const fetchMessages = useFetchMessages();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { sendMessage, typingUsers } = useWebSocket({
    hallId: safeHallId || null,
    roomId: safeRoomId || null,
    enabled: !!safeHallId && !!safeRoomId && !isDm,
  });

  // Fetch messages on room change
  useEffect(() => {
    if (!safeHallId || !safeRoomId || isDm) return;
    fetchMessages(safeHallId, safeRoomId);
  }, [safeHallId, safeRoomId, isDm]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Username resolver (fixes missing username issue)
  const getUsername = (m: any) =>
    m?.author?.username || m?.author?.display_name || m?.sender || "Unknown";

  const formatTime = (t?: string) =>
    t
      ? new Date(t).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const handleSend = () => {
    if (!input.trim() || !safeRoomId) return;

    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => {
          const isCurrentUser = m.author_id === user?.id;
          return (
            <div 
              key={m.id} 
              className={`mb-3 ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                <div className="flex gap-2 text-sm text-gray-600 mb-1">
                  <span className="font-semibold">{getUsername(m)}</span>
                  <span>{formatTime(m.sent_at)}</span>
                </div>

                <div className={`text-gray-900 ${isCurrentUser ? 'bg-blue-100 rounded-l-lg rounded-tr-lg px-3 py-2 inline-block' : 'bg-gray-100 rounded-r-lg rounded-tl-lg px-3 py-2 inline-block'}`}>
                  {m.content}
                </div>

                {m.isOptimistic && (
                  <span className="text-xs text-gray-400 ml-2">sending...</span>
                )}
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="text-xs italic text-gray-400">typing...</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="p-3 border-t flex gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />

        <button
          onClick={handleSend}
          className="px-3 bg-blue-700 text-white rounded"
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}