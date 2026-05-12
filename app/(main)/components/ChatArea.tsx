"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSend, FiEdit2, FiTrash2 } from "react-icons/fi";
import { BiSmile } from "react-icons/bi";
import { FaPlus } from "react-icons/fa6";
import { PanelRightClose, PanelRightOpen, Check, X } from "lucide-react";
import { useAvatar, useUser } from "@/app/store/useUserStore";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
  useMessagesForRoom,
  useFetchMessages,
  useAddOptimisticMessage,
  useUpdateMessage,
  useDeleteMessage,
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
  isDm,
  onToggleRightSidebar,
  isRightSidebarCollapsed,
}: ChatAreaProps) {
  const user = useUser();
  const messages = useMessagesForRoom(roomId || "");
  const fetchMessages = useFetchMessages();
  const addOptimistic = useAddOptimisticMessage();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isConnected, sendMessage, typingUsers } =
    useWebSocket({
      roomId: roomId || null,
      hallId: hallId || null,
      enabled: !!roomId && !!hallId && !isDm,
    });

  useEffect(() => {
    if (!hallId || !roomId || isDm) return;
    fetchMessages(hallId, roomId);
  }, [hallId, roomId, isDm]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || !user || !roomId) return;

    const content = input.trim();
    sendMessage(content);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleTyping = typingUsers.filter(
    (id) => id !== user?.id
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className="mb-3">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-700">
                {m.author?.display_name}
              </span>
              <span className="text-xs text-gray-400">
                {m.sent_at && formatTime(m.sent_at)}
              </span>
            </div>
            <div className="text-gray-900 pl-1">
              {m.content}
            </div>
            {m.isOptimistic && (
              <span className="text-xs ml-2 text-gray-400">
                sending...
              </span>
            )}
          </div>
        ))}

        {visibleTyping.length > 0 && (
          <div className="text-sm italic text-gray-500 mb-2">
            typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-[#dcd9d3] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-[#dcd9d3] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
        />
        <button 
          onClick={handleSend}
          className="px-3 py-2 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}