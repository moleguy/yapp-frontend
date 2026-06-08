import { Message, UserMeRes, HallMember } from "@/lib/api";

export type ResolvedMessageAuthor = {
  displayName: string;
  username: string | null;
};

/** Hall nickname > profile display name > API author fields > current user. */
export function resolveMessageAuthor(
  message: Message,
  currentUser: UserMeRes | null,
  hallMembers: HallMember[] = []
): ResolvedMessageAuthor {
  const member = hallMembers.find((m) => m.user_id === message.author_id);
  const author = message.author;
  const isSelf = currentUser?.id === message.author_id;

  const username =
    member?.user?.username ??
    author?.username ??
    (isSelf ? currentUser!.username : null) ??
    null;

  const displayName =
    member?.nickname ||
    member?.user?.display_name ||
    author?.display_name ||
    (isSelf ? currentUser!.display_name : null) ||
    username ||
    "Unknown";

  return { displayName, username };
}

/** Enrich WS/REST messages so author.display_name is always populated. */
export function enrichMessageAuthor(
  message: Message,
  currentUser: UserMeRes | null,
  hallMembers: HallMember[] = []
): Message {
  const { displayName, username } = resolveMessageAuthor(
    message,
    currentUser,
    hallMembers
  );

  const member = hallMembers.find((m) => m.user_id === message.author_id);
  const profile = member?.user;
  const author = message.author;

  if (!username && displayName === "Unknown" && !profile && !author) {
    return message;
  }

  return {
    ...message,
    author: {
      id: message.author_id,
      username: username ?? "",
      display_name: displayName,
      email: author?.email ?? "",
      phone_number: author?.phone_number ?? null,
      avatar_url: profile?.avatar_url ?? author?.avatar_url ?? null,
      avatar_thumbnail_url:
        profile?.avatar_thumbnail_url ?? author?.avatar_thumbnail_url ?? null,
      description: profile?.description ?? author?.description ?? null,
      friend_policy: author?.friend_policy ?? "",
      active: author?.active ?? true,
      created_at: author?.created_at ?? "",
      updated_at: author?.updated_at ?? "",
    },
  };
}

export function getMessageDisplayName(
  message: Message,
  currentUser: UserMeRes | null,
  hallMembers: HallMember[] = []
): string {
  return resolveMessageAuthor(message, currentUser, hallMembers).displayName;
}

export function getMessageUsername(
  message: Message,
  currentUser: UserMeRes | null,
  hallMembers: HallMember[] = []
): string | null {
  return resolveMessageAuthor(message, currentUser, hallMembers).username;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseMessageDate(sentAt?: string): Date | null {
  if (!sentAt) return null;
  const date = new Date(sentAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local calendar day key for grouping messages (YYYY-MM-DD). */
export function getMessageDayKey(sentAt?: string): string {
  const date = parseMessageDate(sentAt);
  if (!date) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Time only — shown on each message bubble header. */
export function formatMessageTime(sentAt?: string): string {
  const date = parseMessageDate(sentAt);
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Centered date divider label (WhatsApp-style).
 * Today / Yesterday / month+day (current year) / full date (prior years).
 */
export function formatMessageDateLabel(sentAt?: string): string {
  const date = parseMessageDate(sentAt);
  if (!date) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameCalendarDay(date, now)) return "Today";
  if (isSameCalendarDay(date, yesterday)) return "Yesterday";

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "long", day: "numeric" });
  }

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function shouldShowDateDivider(
  messages: Message[],
  index: number,
): boolean {
  if (index === 0) return true;
  const current = getMessageDayKey(messages[index]?.sent_at);
  const previous = getMessageDayKey(messages[index - 1]?.sent_at);
  return !!current && current !== previous;
}
