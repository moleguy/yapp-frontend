// Centralized REST client for calling the Go backend from the Next.js frontend

const isProxyEnabled = true;
const rawBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:8080";

// When proxy is enabled, all REST calls go through /api/proxy?path=...
// The proxy forwards to rawBase + path, so path must include /api/v1/...
export const apiBase = isProxyEnabled ? "" : rawBase;

// Builds the final fetch URL given a backend path like "/api/v1/me/"
function buildUrl(path: string): string {
  if (isProxyEnabled) {
    return `/api/proxy?path=${encodeURIComponent(path)}`;
  }
  return `${rawBase}${path}`;
}

// ========== CSRF ==========

let csrfTokenFromApi: string | null = null;

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = decodeURIComponent(document.cookie).match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

function resolveCSRFToken(): string | null {
  return csrfTokenFromApi || getCSRFTokenFromCookie();
}

async function primeCsrf(): Promise<void> {
  if (resolveCSRFToken()) return;
  const res = await fetch(buildUrl("/health"), {
    method: "GET",
    credentials: "include",
    headers: { "ngrok-skip-browser-warning": "true" },
  });
  const echo = res.headers.get("x-csrf-token");
  if (echo) csrfTokenFromApi = echo;
}

// ========== REQUEST HELPER ==========

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (init?.headers) {
    const h = init.headers;
    if (h instanceof Headers) {
      h.forEach((v, k) => { headers[k] = v; });
    } else {
      Object.assign(headers, h as Record<string, string>);
    }
  }

  const method = (init?.method || "GET").toUpperCase();

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!resolveCSRFToken()) await primeCsrf();
    const csrf = resolveCSRFToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  // Forward JWT token in Authorization header
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yapp_access_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const finalUrl = buildUrl(path);
  console.log("[Request]", method, finalUrl);

  let res: Response;
  try {
    res = await fetch(finalUrl, { credentials: "include", ...init, headers });
  } catch (err) {
    throw new Error(`Network error: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log("[Request] Status:", res.status, path);

  const echo = res.headers.get("x-csrf-token");
  if (echo) csrfTokenFromApi = echo;

  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const body = isJSON ? await res.json() : await res.text();

  if (!res.ok) {
    let msg: string | undefined;
    if (isJSON && body && typeof body === "object") {
      msg = (body as any).error || (body as any).message;
    }
    if (!msg && typeof body === "string") msg = body;
    throw new Error(msg || res.statusText || "Request failed");
  }

  // Unwrap { success, message, data } envelope
  if (isJSON && body && typeof body === "object" && "data" in body) {
    const d = (body as any).data;
    if (d !== null && d !== undefined) return d as T;
  }

  return body as T;
}

// ========== TYPES ==========

export type SignInReq = { email: string; password: string };
export type SignInRes = {
  id: string; username: string; display_name: string; email: string;
  phone_number: string | null; avatar_url: string | null; avatar_thumbnail_url: string | null;
  description: string | null; friend_policy: string; active: boolean;
  created_at: string; updated_at: string; success: boolean; message?: string; access_token?: string;
};

export type SignUpReq = { username: string; password: string; email: string; display_name: string };
export type SignUpRes = { id?: string; username?: string; success: boolean; message?: string };

export type UserMeRes = {
  id: string; username: string; display_name: string; email: string;
  phone_number: string | null; avatar_url: string | null; avatar_thumbnail_url: string | null;
  description: string | null; friend_policy: string; active: boolean;
  created_at: string; updated_at: string; access_token?: string;
};

export type UpdateUserMeReq = {
  display_name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  avatar_thumbnail_url?: string | null;
  friend_policy?: "everyone" | "friends" | "no_one" | null;
};
export type UpdateUserMeRes = UserMeRes;

export type CreateHallReq = {
  name: string; is_private?: boolean; icon_url: string | null;
  icon_thumbnail_url?: string | null; banner_color: string | null; description: string | null;
};
export type Hall = {
  id: string; name: string; is_private: boolean; icon_url: string | null;
  icon_thumbnail_url?: string | null; banner_color: string | null; description: string | null;
  created_at: string; updated_at: string; owner_id: string;
};
/** PATCH /halls/:hallID/settings/profile */
export type HallProfileUpdateReq = {
  name?: string;
  is_private?: boolean;
  description?: string | null;
  banner_color?: string;
};

export type Floor = {
  id: string; hall_id: string; name: string; position: number;
  is_private: boolean; created_at: string; updated_at: string; access_token?: string;
};
export type CreateFloorReq = { hall_id: string; name: string; is_private: boolean };
export type UpdateFloorReq = { name?: string; is_private?: boolean };

export type RoomType = "text" | "audio";
export type Room = {
  id: string; hall_id: string; floor_id: string | null; name: string;
  room_type: RoomType; position: number; is_private: boolean;
  created_at: string; updated_at: string; access_token?: string;
};
export type CreateRoomReq = { hall_id: string; floor_id: string | null; name: string; room_type: RoomType; is_private?: boolean };
export type UpdateRoomReq = { name?: string; is_private?: boolean };
export type MoveRoomReq = { hall_id: string; new_floor_id: string | null; after_id: string | null };
export type MoveFloorReq = { hall_id: string; after_id: string | null };
export type FloorWithRooms = Floor & { rooms: Room[] };
export type GetHallRoomsRes = { top_level: Room[]; floors: FloorWithRooms[] };

export type Attachment = {
  id: string; message_id: string; file_name: string; url: string;
  file_type: string; file_size: number; created_at: string; updated_at: string; access_token?: string;
};
export type AttachmentReq = { file_name: string; url: string; file_type?: string; file_size?: number };
export type Reaction = { message_id: string; user_id: string; emoji: string; created_at?: string };
export type ReactionGroup = {
  emoji: string;
  count: number;
  user_ids: { id: string; username: string; email: string; avatar_url: string | null }[];
};
export type Message = {
  id: string; room_id: string; author_id: string; content: string;
  mention_everyone?: boolean;
  sent_at: string; edited_at: string | null; deleted_at: string | null;
  attachments?: Attachment[]; reactions?: ReactionGroup[]; author?: UserMeRes; isOptimistic?: boolean;
};
export type UpdateMessageReq = { content: string };
export type MessagesResponse = { messages: Message[]; has_more: boolean };
export type FetchMessagesOpts = { limit?: number; before?: string; after?: string; around?: string };

export type PermissionDetail = {
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
};
export type PermissionCategory = {
  name: string;
  description: string;
  permissions: PermissionDetail[];
};
/** GET /halls/:hallID/settings/roles/:roleID/permissions */
export type RolePermissionsData = {
  role_id: string;
  role_name: string;
  is_admin: boolean;
  is_default: boolean;
  categories: PermissionCategory[];
};
/** PATCH body — boolean flags; omitted = unchanged */
export type UpdateRolePermissionsReq = Partial<{
  view_channels: boolean;
  manage_channels: boolean;
  manage_roles: boolean;
  manage_servers: boolean;
  manage_invites: boolean;
  manage_requests: boolean;
  change_nickname: boolean;
  manage_nicknames: boolean;
  kick_members: boolean;
  ban_members: boolean;
  text_send_messages: boolean;
  text_attach_files: boolean;
  text_mention_roles: boolean;
  text_manage_messages: boolean;
  text_read_history: boolean;
  text_send_voice: boolean;
  voice_connect: boolean;
  voice_speak: boolean;
  voice_video: boolean;
  voice_mute_members: boolean;
}>;
export type UpdateRolePermissionsRes = {
  success: boolean;
  message: string;
  role_id: string;
  categories: PermissionCategory[];
};

export type Role = {
  id: string; hall_id: string; name: string; color: string | null;
  icon_url?: string | null;
  is_admin: boolean; is_default: boolean; created_at: string; updated_at: string;
};
export type CreateRoleReq = {
  name: string;
  color?: string | null;
  icon_url?: string | null;
  is_default?: boolean;
  is_admin?: boolean;
};
export type UpdateRoleReq = {
  name?: string | null;
  color?: string | null;
  icon_url?: string | null;
  is_default?: boolean;
  is_admin?: boolean;
};

export type HallMember = {
  id: string;
  hall_id: string; user_id: string; role_id: string; nickname: string | null;
  joined_at: string; updated_at: string;
  presence?: { user_id: string; status: string; last_seen_at?: string; updated_at: string };
  user?: UserMeRes;
};
export type UpdateHallMemberRoleReq = { role_id: string };
export type UpdateHallMemberNicknameReq = { nickname: string | null };

export type JoinHallRes = {
  status: "joined" | "requested";
  member_id: string | null;
  request_id: string | null;
  hall_id: string;
  user_id: string;
  role_id: string | null;
  nickname: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HallJoinRequest = {
  id: string;
  hall_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type HallBan = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};
export type CreateBanReq = { user_id: string; reason: string };

export type InviteExpireAfter =
  | "30min" | "1hr" | "6hr" | "12hr" | "1day" | "7days" | "never";

export type HallInvite = {
  id: string;
  code: string;
  hall_id: string;
  created_by: string;
  url: string;
  role_id: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  is_valid: boolean;
};
export type CreateInviteReq = {
  expire_after: InviteExpireAfter;
  max_uses?: number | null;
  role_id?: string | null;
};
export type InviteInfo = {
  code: string;
  hall_id: string;
  hall_name: string;
  icon_thumbnail_url: string | null;
  role_id: string | null;
  role_name: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_valid: boolean;
};
export type AcceptInviteLinkRes = {
  hall_id: string;
  member_id: string;
  role_id: string | null;
  joined_at: string;
};

export type WSBaseMessage = { room_id: string; author_id: string; sent_at: string };
export type WSTextMessage = WSBaseMessage & {
  type: "text"; id?: string; content?: string;
  mention_everyone?: boolean;
  mentions_everyone?: boolean;
  mentions?: string[] | UserMeRes[];
  attachments?: Attachment[];
  created_at?: string; updated_at?: string; edited_at?: string | null; deleted_at?: string | null;
};
export type WSTypingMessage = WSBaseMessage & { type: "typing"; typing_user?: string };
export type WSStopTypingMessage = WSBaseMessage & { type: "stop_typing"; typing_user?: string };
export type WSPresenceMessage = WSBaseMessage & {
  type: "presence";
  presence_user_id: string;
  presence_status: string;
  last_seen_at?: string;
};
export type WSJoinMessage = WSBaseMessage & { type: "join" };
export type WSLeaveMessage = WSBaseMessage & { type: "leave" };
export type WSEditMessage = WSBaseMessage & { type: "edit"; id: string; content: string; edited_at: string };
export type WSDeleteMessage = WSBaseMessage & { type: "delete"; id: string };
export type WSReactMessage = WSBaseMessage & { type: "react"; message_id: string; user_id: string; emoji: string; action: "add" | "remove" };
export type WSErrorMessage = WSBaseMessage & { type: "error"; error: string };
export type WSMessage =
  | WSTextMessage
  | WSTypingMessage
  | WSStopTypingMessage
  | WSPresenceMessage
  | WSJoinMessage
  | WSLeaveMessage
  | WSEditMessage
  | WSDeleteMessage
  | WSReactMessage
  | WSErrorMessage;
export type WSSendTextMessage = {
  type: "text"; room_id: string; content: string; sent_at: string;
  mention_everyone?: boolean; mentions?: string[]; attachments?: Omit<AttachmentReq, "id">[];
};
export type AppError = { code: number; message: string };

export type PresenceStatus = "online" | "offline" | "away" | "busy";
export type UserPresenceRes = {
  user_id: string;
  status: PresenceStatus;
  last_seen_at?: string;
  updated_at: string;
};

/** Flatten GET role permissions for simple feature checks */
export function flattenRolePermissions(data: RolePermissionsData): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const cat of data.categories) {
    for (const p of cat.permissions) {
      out[p.key] = p.is_enabled;
    }
  }
  return out;
}

// ========== AUTH ==========

export async function authSignIn(payload: SignInReq): Promise<SignInRes> {
  const empty: SignInRes = {
    id: "", username: "", display_name: "", email: "", phone_number: null,
    avatar_url: null, avatar_thumbnail_url: null, description: null, friend_policy: "",
    created_at: "", updated_at: "", active: false, success: false,
  };

  try {
    const res = await fetch(buildUrl("/api/v1/auth/signin"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Non-JSON response (${res.status}): ${text.substring(0, 100)}`);
    }

    const body = await res.json();
    console.log("[AuthSignIn] Response:", body);

    if (!res.ok) throw new Error(body.message || body.error || "Signin failed");

    const token = res.headers.get("X-Yapp-Token") || body.data?.access_token || body.access_token;
    if (token) localStorage.setItem("yapp_access_token", token);

    const result: SignInRes = {
      ...(body.data?.user_me || body.data || {}),
      success: body.success,
      message: body.message,
    };

    if (!result.id) return { ...empty, success: false, message: "Invalid response - missing user ID" };

    console.log("[AuthSignIn] Signed in:", result.username);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    console.error("[AuthSignIn]", message);
    return { ...empty, success: false, message };
  }
}

export async function authSignUp(payload: SignUpReq): Promise<SignUpRes> {
  try {
    return await request<SignUpRes>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Sign up failed" };
  }
}

export async function authSignOut(): Promise<{ message?: string } | undefined> {
  try {
    return await request<{ message?: string }>("/api/v1/auth/signout", { method: "GET" });
  } catch (err) {
    return { message: err instanceof Error ? err.message : "Sign out failed" };
  }
}

// ========== USER ==========

export async function getUserMe(): Promise<UserMeRes | null> {
  try {
    const result = await request<UserMeRes>("/api/v1/me/", { method: "GET" });
    const token = localStorage.getItem("yapp_access_token");
    return result && token ? { ...result, access_token: token } : result;
  } catch (err) {
    console.error("[getUserMe]", err);
    return null;
  }
}

export async function updateUserMe(payload: UpdateUserMeReq | null): Promise<UpdateUserMeRes | null> {
  try {
    return await request<UpdateUserMeRes>("/api/v1/me/", { method: "PATCH", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function getUser(userId: string): Promise<UserMeRes | null> {
  try {
    return await request<UserMeRes>(`/api/v1/users/${userId}`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

// ========== HALLS ==========

export async function createHall(payload: CreateHallReq): Promise<Hall | null> {
  try {
    return await request<Hall>("/api/v1/halls", { method: "POST", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function getUserHalls(): Promise<Hall[] | null> {
  try {
    return await request<Hall[]>("/api/v1/halls", { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function getHall(hallId: string): Promise<Hall | null> {
  try {
    return await request<Hall>(`/api/v1/halls/${hallId}`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function patchHallProfile(hallId: string, payload: HallProfileUpdateReq): Promise<Hall | null> {
  try {
    return await request<Hall>(`/api/v1/halls/${hallId}/settings/profile`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function deleteHall(hallId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function joinHall(hallId: string): Promise<JoinHallRes | null> {
  try {
    return await request<JoinHallRes>(`/api/v1/halls/${hallId}/join`, { method: "POST" });
  } catch (err) { console.error(err); return null; }
}

export async function leaveHall(hallId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/leave`, { method: "POST" });
    return true;
  } catch (err) { console.error(err); return false; }
}

// ========== FLOORS ==========

export async function getFloors(hallId: string): Promise<Floor[] | null> {
  try {
    const res = await request<{ floors: Floor[] }>(`/api/v1/halls/${hallId}/floors`, { method: "GET" });
    return res?.floors ?? [];
  } catch (err) { console.error(err); return null; }
}

export async function createFloor(hallId: string, payload: CreateFloorReq): Promise<Floor | null> {
  try {
    return await request<Floor>(`/api/v1/halls/${hallId}/floors`, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function updateFloor(hallId: string, floorId: string, payload: UpdateFloorReq): Promise<Floor | null> {
  try {
    return await request<Floor>(`/api/v1/halls/${hallId}/floors/${floorId}`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function deleteFloor(hallId: string, floorId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/floors/${floorId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

// ========== ROOMS ==========

export async function getRooms(hallId: string): Promise<GetHallRoomsRes | null> {
  try {
    return await request<GetHallRoomsRes>(`/api/v1/halls/${hallId}/rooms`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function createRoom(hallId: string, payload: CreateRoomReq): Promise<Room | null> {
  try {
    return await request<Room>(`/api/v1/halls/${hallId}/rooms`, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function updateRoom(hallId: string, roomId: string, payload: UpdateRoomReq): Promise<Room | null> {
  try {
    return await request<Room>(`/api/v1/halls/${hallId}/rooms/${roomId}`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function deleteRoom(hallId: string, roomId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/rooms/${roomId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function moveRoom(hallId: string, roomId: string, payload: MoveRoomReq): Promise<Room | null> {
  try {
    return await request<Room>(`/api/v1/halls/${hallId}/rooms/${roomId}/move`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (err) { console.error(err); return null; }
}

export async function moveFloor(hallId: string, floorId: string, payload: MoveFloorReq): Promise<Floor | null> {
  try {
    return await request<Floor>(`/api/v1/halls/${hallId}/floors/${floorId}/move`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } catch (err) { console.error(err); return null; }
}

// ========== MESSAGES ==========

export async function getMessages(hallId: string, roomId: string, opts?: FetchMessagesOpts): Promise<MessagesResponse | null> {
  try {
    const p = new URLSearchParams();
    p.append("limit", String(opts?.limit ?? 50));
    if (opts?.before) p.append("before", opts.before);
    if (opts?.after) p.append("after", opts.after);
    if (opts?.around) p.append("around", opts.around);
    const q = p.toString();
    return await request<MessagesResponse>(`/api/v1/halls/${hallId}/rooms/${roomId}/messages?${q}`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function getMessage(hallId: string, roomId: string, messageId: string): Promise<Message | null> {
  try {
    return await request<Message>(`/api/v1/halls/${hallId}/rooms/${roomId}/messages/${messageId}`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function updateMessage(hallId: string, roomId: string, messageId: string, payload: UpdateMessageReq): Promise<Message | null> {
  try {
    return await request<Message>(`/api/v1/halls/${hallId}/rooms/${roomId}/messages/${messageId}`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function deleteMessage(hallId: string, roomId: string, messageId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/rooms/${roomId}/messages/${messageId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

// ========== REACTIONS ==========

export async function addReaction(hallId: string, roomId: string, messageId: string, emoji: string): Promise<boolean> {
  try {
    const enc = encodeURIComponent(emoji);
    await request<{ message: string }>(
      `/api/v1/halls/${hallId}/rooms/${roomId}/messages/${messageId}/reactions/${enc}`,
      { method: "PUT" },
    );
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function removeReaction(hallId: string, roomId: string, messageId: string, emoji: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/rooms/${roomId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

// ========== HALL SETTINGS ==========

export async function getHallMembers(hallId: string): Promise<{ members: HallMember[]; total: number } | null> {
  try {
    return await request<{ members: HallMember[]; total: number }>(`/api/v1/halls/${hallId}/settings/members`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function updateHallMemberRole(
  hallId: string,
  memberId: string,
  payload: UpdateHallMemberRoleReq,
): Promise<HallMember | null> {
  try {
    return await request<HallMember>(
      `/api/v1/halls/${hallId}/settings/members/${memberId}/role`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  } catch (err) { console.error(err); return null; }
}

export async function updateHallMemberNickname(
  hallId: string,
  memberId: string,
  payload: UpdateHallMemberNicknameReq,
): Promise<HallMember | null> {
  try {
    return await request<HallMember>(
      `/api/v1/halls/${hallId}/settings/members/${memberId}/nickname`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  } catch (err) { console.error(err); return null; }
}

export async function kickHallMember(hallId: string, memberId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/settings/members/${memberId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function getRoles(hallId: string): Promise<Role[] | null> {
  try {
    return await request<Role[]>(`/api/v1/halls/${hallId}/settings/roles`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function createRole(hallId: string, payload: CreateRoleReq): Promise<Role | null> {
  try {
    return await request<Role>(`/api/v1/halls/${hallId}/settings/roles`, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function updateRole(hallId: string, roleId: string, payload: UpdateRoleReq): Promise<Role | null> {
  try {
    return await request<Role>(`/api/v1/halls/${hallId}/settings/roles/${roleId}`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function deleteRole(hallId: string, roleId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/settings/roles/${roleId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function getRolePermissions(hallId: string, roleId: string): Promise<RolePermissionsData | null> {
  try {
    return await request<RolePermissionsData>(`/api/v1/halls/${hallId}/settings/roles/${roleId}/permissions`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function updateRolePermissions(
  hallId: string,
  roleId: string,
  payload: UpdateRolePermissionsReq,
): Promise<UpdateRolePermissionsRes | null> {
  try {
    return await request<UpdateRolePermissionsRes>(
      `/api/v1/halls/${hallId}/settings/roles/${roleId}/permissions`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  } catch (err) { console.error(err); return null; }
}

export async function getHallBans(hallId: string): Promise<HallBan[] | null> {
  try {
    const res = await request<{ bans: HallBan[] }>(`/api/v1/halls/${hallId}/settings/bans`, { method: "GET" });
    return res?.bans ?? [];
  } catch (err) { console.error(err); return null; }
}

export async function banUser(hallId: string, payload: CreateBanReq): Promise<boolean> {
  try {
    await request<unknown>(`/api/v1/halls/${hallId}/settings/bans`, { method: "POST", body: JSON.stringify(payload) });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function unbanUser(hallId: string, banId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/settings/bans/${banId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function getHallInvites(hallId: string): Promise<HallInvite[] | null> {
  try {
    return await request<HallInvite[]>(`/api/v1/halls/${hallId}/settings/invites`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function createInvite(hallId: string, payload: CreateInviteReq): Promise<HallInvite | null> {
  try {
    return await request<HallInvite>(`/api/v1/halls/${hallId}/settings/invites`, { method: "POST", body: JSON.stringify(payload) });
  } catch (err) { console.error(err); return null; }
}

export async function revokeInvite(hallId: string, inviteId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`/api/v1/halls/${hallId}/settings/invites/${inviteId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

export async function getPublicInviteInfo(inviteCode: string): Promise<InviteInfo | null> {
  try {
    return await request<InviteInfo>(`/api/v1/invites/${inviteCode}`, { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function acceptInvite(inviteCode: string): Promise<AcceptInviteLinkRes | null> {
  try {
    return await request<AcceptInviteLinkRes>(`/api/v1/invites/${inviteCode}/accept`, { method: "POST" });
  } catch (err) { console.error(err); return null; }
}

// ========== JOIN REQUESTS ==========

export async function getJoinRequests(hallId: string): Promise<{ requests: HallJoinRequest[]; total: number } | null> {
  try {
    return await request<{ requests: HallJoinRequest[]; total: number }>(
      `/api/v1/halls/${hallId}/settings/requests`,
      { method: "GET" },
    );
  } catch (err) { console.error(err); return null; }
}

export async function acceptJoinRequest(hallId: string, requestId: string): Promise<unknown | null> {
  try {
    return await request<unknown>(
      `/api/v1/halls/${hallId}/settings/requests/${requestId}/accept`,
      { method: "PATCH", body: JSON.stringify({}) },
    );
  } catch (err) { console.error(err); return null; }
}

export async function declineJoinRequest(hallId: string, requestId: string): Promise<boolean> {
  try {
    await request<unknown>(`/api/v1/halls/${hallId}/settings/requests/${requestId}`, { method: "DELETE" });
    return true;
  } catch (err) { console.error(err); return false; }
}

// ========== PRESENCE ==========

export async function getMyPresence(): Promise<UserPresenceRes | null> {
  try {
    return await request<UserPresenceRes>("/api/v1/presence/me", { method: "GET" });
  } catch (err) { console.error(err); return null; }
}

export async function updateMyPresence(status: PresenceStatus): Promise<UserPresenceRes | null> {
  try {
    return await request<UserPresenceRes>("/api/v1/presence/me", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch (err) { console.error(err); return null; }
}

export async function getPresencesForUsers(userIds: string[]): Promise<UserPresenceRes[] | null> {
  if (userIds.length === 0) return [];
  try {
    const q = userIds.map(encodeURIComponent).join(",");
    const res = await request<{ presences: UserPresenceRes[] }>(`/api/v1/presence/users?ids=${q}`, { method: "GET" });
    return res?.presences ?? [];
  } catch (err) { console.error(err); return null; }
}

// ========== WEBSOCKET ==========

export function getWebSocketUrl(roomId: string): string {
  const cleanUrl = rawBase.replace(/\/+$/, "");
  const protocol = cleanUrl.startsWith("https") ? "wss" : "ws";
  const host = cleanUrl.replace(/^https?:\/\//, "");
  // NOTE: Do NOT pass token as query parameter. Browser will automatically include JWT cookie from sign-in.
  // Backend's AuthMiddleware looks for JWT in cookie "jwt" or Authorization header, not in query params.
  const url = `${protocol}://${host}/ws/rooms/${roomId}`;
  console.log("[WebSocket] URL:", url);
  return url;
}