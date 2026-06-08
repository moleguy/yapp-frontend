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
  const base = member?.user ?? message.author;

  if (!username && displayName === "Unknown" && !base) {
    return message;
  }

  return {
    ...message,
    author: {
      id: message.author_id,
      username: username ?? "",
      display_name: displayName,
      email: base?.email ?? "",
      phone_number: base?.phone_number ?? null,
      avatar_url: base?.avatar_url ?? null,
      avatar_thumbnail_url: base?.avatar_thumbnail_url ?? null,
      description: base?.description ?? null,
      friend_policy: base?.friend_policy ?? "",
      active: base?.active ?? true,
      created_at: base?.created_at ?? "",
      updated_at: base?.updated_at ?? "",
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
