import { Message, UserMeRes, HallMember } from "@/lib/api";

/** WS outbound messages carry author_id only; enrich from cache or current user. */
export function enrichMessageAuthor(
  message: Message,
  currentUser: UserMeRes | null,
  hallMembers: HallMember[] = []
): Message {
  if (message.author?.display_name || message.author?.username) {
    return message;
  }

  if (currentUser && message.author_id === currentUser.id) {
    return {
      ...message,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        display_name: currentUser.display_name,
        email: currentUser.email,
        phone_number: currentUser.phone_number,
        avatar_url: currentUser.avatar_url,
        avatar_thumbnail_url: currentUser.avatar_thumbnail_url,
        description: currentUser.description,
        friend_policy: currentUser.friend_policy,
        active: currentUser.active,
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at,
      },
    };
  }

  const member = hallMembers.find((m) => m.user_id === message.author_id);
  if (member?.user) {
    return { ...message, author: member.user };
  }
  if (member) {
    const displayName = member.nickname || "Unknown";
    return {
      ...message,
      author: {
        id: member.user_id,
        username: displayName,
        display_name: displayName,
        email: "",
        phone_number: null,
        avatar_url: null,
        avatar_thumbnail_url: null,
        description: null,
        friend_policy: "",
        active: true,
        created_at: "",
        updated_at: "",
      },
    };
  }

  return message;
}

export function getMessageDisplayName(
  message: Message,
  currentUser: UserMeRes | null
): string {
  if (message.author?.display_name) return message.author.display_name;
  if (message.author?.username) return message.author.username;
  if (currentUser && message.author_id === currentUser.id) {
    return currentUser.display_name || currentUser.username;
  }
  return "Unknown";
}
