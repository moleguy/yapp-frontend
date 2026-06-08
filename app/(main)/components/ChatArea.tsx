"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSend, FiEdit2, FiTrash2, FiSmile, FiCopy } from "react-icons/fi";
import { useUser } from "@/app/store/useUserStore";
import { useWebSocket, useTypingIndicator } from "@/app/hooks/useWebSocket";
import {
  useMessagesForRoom,
  useFetchMessages,
} from "@/app/store/useMessageStore";
import { useReactionCounts, useReactionStore } from "@/app/store/useReactionStore";
import {
  formatMessageDateLabel,
  formatMessageTime,
  resolveMessageAuthor,
  shouldShowDateDivider,
} from "@/lib/messageUtils";
import { Message } from "@/lib/api";
import { useHallMembers } from "@/app/store/useHallStore";
import { copyTextToClipboard } from "@/lib/clipboard";
import { useDialog } from "@/app/contexts/DialogContext";
import { EmptyState } from "@/app/(main)/components/FeedbackStates";
import { MessageSquare } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function CopyToast() {
  return (
    <span className="inline-block text-xs text-list-muted bg-surface-app/95 border border-default px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
      Text copied to clipboard
    </span>
  );
}

type ChatAreaProps = {
  hallName?: string;
  roomName?: string;
  hallId?: string;
  roomId?: string;
  friendDisplayName?: string;
  friendId?: string;
  isDm: boolean;
};

function MessageActionButtons({
  onEdit,
  onDelete,
  onCopy,
  onReact,
  showEditDelete,
  align,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy: () => void;
  onReact: () => void;
  showEditDelete: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-list-muted ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {showEditDelete && onEdit && (
        <button type="button" onClick={onEdit} title="Edit" className="hover:text-heading">
          <FiEdit2 className="w-3.5 h-3.5" />
        </button>
      )}
      {showEditDelete && onDelete && (
        <button type="button" onClick={onDelete} title="Delete" className="hover:text-heading">
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
        }}
        title="Copy"
        className="hover:text-heading"
      >
        <FiCopy className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onReact} title="React" className="hover:text-heading">
        <FiSmile className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-4" role="separator" aria-label={label}>
      <span className="text-xs font-medium text-secondary bg-surface-date-divider px-3 py-1 rounded-lg shadow-sm">
        {label}
      </span>
    </div>
  );
}

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
              reacted ? "bg-primary-subtle border-primary-soft" : "bg-surface-elevated border-subtle"
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
  const { confirm } = useDialog();
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
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastReadRef = useRef<string | null>(null);
  const copyNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => {
      if (copyNoticeTimerRef.current) clearTimeout(copyNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!safeRoomId || messages.length === 0 || isDm) return;
    const latest = messages[messages.length - 1];
    if (latest.id && latest.id !== lastReadRef.current && !latest.isOptimistic) {
      lastReadRef.current = latest.id;
      sendRead(latest.id);
    }
  }, [messages, safeRoomId, isDm, sendRead]);

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
    if (!(await confirm({ message: "Delete this message?", destructive: true }))) return;
    await sendDelete(messageId);
  };

  const handleReact = async (messageId: string, emoji: string, action: "add" | "remove") => {
    await sendReact(messageId, emoji, action);
    setReactionPickerId(null);
  };

  const handleCopy = (messageId: string, content: string) => {
    if (!copyTextToClipboard(content)) return;
    setCopiedMessageId(messageId);
    if (copyNoticeTimerRef.current) clearTimeout(copyNoticeTimerRef.current);
    copyNoticeTimerRef.current = setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-subtle">
        {messages.length === 0 ? (
          <EmptyState
            title="No messages yet"
            description={
              isDm
                ? "Send a message to start the conversation."
                : "Be the first to say something in this room."
            }
            icon={<MessageSquare className="w-7 h-7" />}
            fullHeight={false}
            className="h-full"
          />
        ) : null}
        {messages.map((m, index) => {
          const isCurrentUser = m.author_id === user?.id;
          const isEditing = editingId === m.id;
          const { displayName, username } = resolveMessageAuthor(m, user, hallMembers);
          const showDateDivider = shouldShowDateDivider(messages, index);

          const toggleReactionPicker = () =>
            setReactionPickerId(reactionPickerId === m.id ? null : m.id);

          return (
            <React.Fragment key={m.id}>
              {showDateDivider && (
                <DateDivider label={formatMessageDateLabel(m.sent_at)} />
              )}
            <div
              className={`mb-3 ${isCurrentUser ? "flex justify-end" : "flex justify-start"}`}
            >
              <div className={`max-w-[70%] ${isCurrentUser ? "text-right" : "text-left"}`}>
                <div className="inline-block max-w-full group">
                  {isCurrentUser ? (
                    <div className="text-xs text-list-muted mb-1 text-right">
                      {formatMessageTime(m.sent_at)}
                    </div>
                  ) : (
                    <div className="flex gap-2 text-sm text-secondary mb-1 items-baseline">
                      <span
                        className="font-semibold cursor-default"
                        title={username ? `@${username}` : undefined}
                      >
                        {displayName}
                      </span>
                      <span>{formatMessageTime(m.sent_at)}</span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex gap-2 text-left">
                      <input
                        className="flex-1 border px-2 py-1 rounded text-sm"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                      <button type="button" onClick={saveEdit} className="text-sm text-primary">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-sm text-list-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`text-heading inline-block max-w-full px-3 py-2 ${
                        isCurrentUser
                          ? "bg-primary-subtle rounded-l-lg rounded-tr-lg text-right"
                          : "bg-surface-inset rounded-r-lg rounded-tl-lg text-left"
                      }`}
                    >
                      {m.content}
                    </div>
                  )}

                  {!isEditing && !m.isOptimistic && (
                    <MessageActionButtons
                      showEditDelete={isCurrentUser}
                      align={isCurrentUser ? "right" : "left"}
                      onEdit={isCurrentUser ? () => startEdit(m) : undefined}
                      onDelete={isCurrentUser ? () => handleDelete(m.id) : undefined}
                      onCopy={() => handleCopy(m.id, m.content)}
                      onReact={toggleReactionPicker}
                    />
                  )}

                  {copiedMessageId === m.id && (
                    <div
                      className={`mt-1.5 pointer-events-none ${
                        isCurrentUser ? "text-right" : "text-left"
                      }`}
                      role="status"
                      aria-live="polite"
                    >
                      <CopyToast />
                    </div>
                  )}

                  {reactionPickerId === m.id && user && (
                    <div
                      className={`flex gap-1 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
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
                    <span className="text-xs text-faint mt-1 block">sending...</span>
                  )}
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}

        {(() => {
          const othersTyping = typingUsers.filter((id) => id !== user?.id);
          if (othersTyping.length === 0) return null;
          return (
            <div className="text-xs italic text-faint">
              {othersTyping.length === 1
                ? "Someone is typing..."
                : "Several people are typing..."}
            </div>
          );
        })()}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-default bg-surface-app flex gap-2">
        <input
          className="flex-1 border border-default px-3 py-2 rounded-lg bg-surface-card focus:outline-none focus:border-primary"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            sendTypingIndicator();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button
          type="button"
          onClick={handleSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-on-primary transition-colors hover:bg-[var(--primary-hover)]"
          aria-label="Send message"
        >
          <FiSend className="h-[1.1em] w-[1.1em]" />
        </button>
      </div>
    </div>
  );
}
