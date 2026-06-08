"use client";

import React from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "@/app/store/useUserStore";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import {
  useMessagesForRoom,
  useFetchMessages,
} from "@/app/store/useMessageStore";
import ChatArea from "./ChatArea";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Chat failed to load
        </div>
      );
    }

    return this.props.children;
  }
}

type Props = {
  hallName?: string;
  roomName?: string;
  hallId?: string;
  roomId?: string;
  friendDisplayName?: string;
  friendId?: string;
  isDm: boolean;
};

function ChatAreaContent(props: Props) {
  // Get room and hall info from stores
  const selectedHallId = "default-hall"; // This would come from store in real implementation
  const selectedRoom = { id: "default-room", name: "General" }; // This would come from store

  const user = useUser();
  const messages = useMessagesForRoom(selectedRoom?.id || "");
  const fetchMessages = useFetchMessages();

  const [input, setInput] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { isConnected, sendMessage, typingUsers } = useWebSocket({
    roomId: selectedRoom?.id || null,
    hallId: selectedHallId || null,
    enabled: !!selectedRoom?.id && !!selectedHallId,
  });

  React.useEffect(() => {
    if (!selectedHallId || !selectedRoom?.id) return;
    fetchMessages(selectedHallId, selectedRoom.id);
  }, [selectedHallId, selectedRoom?.id]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || !user || !selectedRoom?.id) return;

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

  const visibleTyping = typingUsers.filter((id) => id !== user?.id);

  // Username resolver (fixes missing username issue)
  const getUsername = (m: any) =>
    m?.author?.username || m?.author?.display_name || m?.sender || "Unknown";

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m) => {
          const isCurrentUser = m.author_id === user?.id;
          return (
            <div 
              key={m.id} 
              className={`mb-3 ${isCurrentUser ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <div className={`max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                <div className="flex gap-2 text-sm text-secondary mb-1">
                  <span className="font-semibold">{getUsername(m)}</span>
                  <span>{m.sent_at && formatTime(m.sent_at)}</span>
                </div>

                <div className={`text-heading ${isCurrentUser ? 'bg-primary-subtle rounded-l-lg rounded-tr-lg px-3 py-2 inline-block' : 'bg-surface-inset rounded-r-lg rounded-tl-lg px-3 py-2 inline-block'}`}>
                  {m.content}
                </div>

                {m.isOptimistic && (
                  <span className="text-xs text-faint ml-2">sending...</span>
                )}
              </div>
            </div>
          );
        })}

        {visibleTyping.length > 0 && (
          <div className="text-sm italic text-list-muted mb-2">
            typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-default flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-default rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Type a message..."
        />
        <button 
          onClick={handleSend}
          className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <FiSend />
        </button>
      </div>
    </div>
  );
}

export default function ChatAreaIntegrated(props: Props) {
  return (
    <ErrorBoundary>
      <ChatAreaContent {...props} />
    </ErrorBoundary>
  );
}