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
    const tempId = `temp-${Date.now()}`;

    const optimistic: ApiMessage = {
      id: tempId,
      room_id: roomId,
      author_id: user.id,
      content,
      sent_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      author: user as any,
    };

    addOptimistic(roomId, optimistic);

    sendMessage(content);

    setInput("");
  };

  const visibleTyping = typingUsers.filter(
    (id) => id !== user?.id
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <b>{m.author?.display_name}</b>: {m.content}
            {m.isOptimistic && (
              <span className="text-xs ml-2 text-gray-400">
                sending...
              </span>
            )}
          </div>
        ))}

        {visibleTyping.length > 0 && (
          <div className="text-sm italic text-gray-500">
            typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={handleSend}>
          <FiSend />
        </button>
      </div>
    </div>
  );
}