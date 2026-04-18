// Centralized REST client for calling the Go backend from the Next.js frontend

// Use proxy during development to bypass CORS issues
const isProxyEnabled = true; // Set to false to call backend directly
const base = isProxyEnabled ? "" : (process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:8080");
export const apiBase = base;
export const protectedApiBase = `${base}/api/v1`;

// API-host csrf cookie is not visible in document.cookie on another origin (e.g. two ngrok URLs).
// Backend sends the same value in X-CSRF-Token (CORS-exposed); we cache it from responses.
let csrfTokenFromApi: string | null = null;

// Same host as API (e.g. localhost:3000 + localhost:8080 share host "localhost")
function getCSRFTokenFromDocumentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const name = "csrf_token=";
  const decodedCookie = decodeURIComponent(document.cookie as string);
  const cookieArray = decodedCookie.split("; ");
  for (const cookie of cookieArray) {
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

function resolveCSRFToken(): string | null {
  return csrfTokenFromApi || getCSRFTokenFromDocumentCookie();
}

/** Must hit Gin (not nginx's static `location = /`). `/health` is always proxied. */
async function primeCsrfFromApi(): Promise<void> {
  if (resolveCSRFToken()) return;

  const healthUrl = isProxyEnabled ? `/api/proxy?path=%2Fhealth` : `${apiBase}/health`;

  const res = await fetch(healthUrl, {
    method: "GET",
    credentials: "include",
    headers: { "ngrok-skip-browser-warning": "true" },
  });
  const echo = res.headers.get("x-csrf-token");
  if (echo) {
    csrfTokenFromApi = echo;
  }
}

// Generic helpers
async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // When using proxy, extract the path from the full URL
  let requestPath = "";
  if (isProxyEnabled && typeof input === "string") {
    // Extract path from URL (e.g., "http://localhost:8080/auth/signin" -> "/auth/signin")
    try {
      const urlObj = new URL(input);
      requestPath = urlObj.pathname + urlObj.search;
    } catch {
      requestPath = input; // fallback
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  // Merge existing headers if provided
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      // Convert Headers object to Record
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (typeof init.headers === "object" && init.headers !== null) {
      // Merge plain object headers
      Object.assign(headers, init.headers as Record<string, string>);
    }
  }

  // Add CSRF token for unsafe methods
  const method = (init?.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!resolveCSRFToken()) {
      console.log("[Request] No CSRF token found, priming from /health");
      await primeCsrfFromApi();
    }
    const csrfToken = resolveCSRFToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
      console.log("[Request] Added CSRF token to headers");
    } else {
      console.warn("[Request] CSRF token not available for", method, input);
    }
  }

  // Determine final URL
  const finalUrl = isProxyEnabled ? `/api/proxy?path=${encodeURIComponent(requestPath)}` : input;
  console.log("[Request]", method, finalUrl, "Headers:", Object.keys(headers));

  let res;
  try {
    res = await fetch(finalUrl, {
      credentials: "include",
      ...init,
      headers,
    });
  } catch (networkError: unknown) {
    const message = networkError instanceof Error ? networkError.message : String(networkError);
    console.error("[Request] Network error - Backend unreachable:", {
      url: finalUrl,
      method,
      message: message,
    });
    console.error("[Request] This usually means:");
    console.error("  1. Backend is not running");
    if (!isProxyEnabled) {
      console.error("  2. CORS is not configured for localhost:3000");
      console.error("  3. Network connection issue");
    }
    throw new Error(`Failed to reach backend: ${message}`);
  }

  console.log("[Request] Response status:", res.status, "for", method, finalUrl);

  const csrfEcho = res.headers.get("x-csrf-token");
  if (csrfEcho) {
    csrfTokenFromApi = csrfEcho;
    console.log("[Request] Updated CSRF token from response");
  }

  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const body = isJSON ? await res.json() : await res.text();

  console.log("[Request] Response body:", body);

  if (!res.ok) {
    let message: string | undefined;
    if (isJSON && body && typeof body === "object") {
      if ("error" in body) {
        message = (body as { error: string }).error;
      } else if ("message" in body) {
        message = (body as { message: string }).message;
      }
    }
    if (!message && typeof body === "string" && body.trim()) {
      message = body;
    }
    const errorMsg = message || res.statusText || "Request failed";
    console.error("[Request] Error:", res.status, errorMsg);
    throw new Error(errorMsg);
  }

  // Backend wraps responses in { success, message, data } envelope
  // Automatically extract data field if present
  if (isJSON && body && typeof body === "object" && "data" in body) {
    const bodyData = body as { data: T };
    if (bodyData.data !== null && bodyData.data !== undefined) {
      console.log("[Request] Extracting data field from envelope");
      return bodyData.data;
    }
  }

  return body as T;
}

// ========== TYPES ==========

// Auth Types
export type SignInReq = {
  email: string;
  password: string;
};
export type SignInRes = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  avatar_thumbnail_url: string | null;
  description: string | null;
  friend_policy: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  success: boolean;
  message?: string;
  access_token?: string;
};

export type SignUpReq = {
  username: string;
  password: string;
  email: string;
  display_name: string;
};
export type SignUpRes = {
  id?: string;
  username?: string;
  success: boolean;
  message?: string;
};

export type UserMeRes = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  avatar_thumbnail_url: string | null;
  description: string | null;
  friend_policy: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type UpdateUserMeReq = {
  display_name: string;
  avatar_url: string | null;
  avatar_thumbnail_url: string | null;
};

export type UpdateUserMeRes = {
  display_name: string;
  avatar_url: string | null;
  avatar_thumbnail_url: string | null;
};

// ========== HALL TYPES ==========
export type CreateHallReq = {
  name: string;
  is_private?: boolean;
  icon_url: string | null;
  icon_thumbnail_url?: string | null;
  banner_color: string | null;
  description: string | null;
};

export type Hall = {
  id: string;
  name: string;
  is_private: boolean;
  icon_url: string | null;
  icon_thumbnail_url?: string | null;
  banner_color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
};

export type UpdateHallReq = {
  name?: string;
  is_private?: boolean;
  icon_url?: string | null;
  icon_thumbnail_url?: string | null;
  banner_color?: string | null;
  description?: string | null;
};

// ========== FLOOR TYPES ==========
export type Floor = {
  id: string;
  hall_id: string;
  name: string;
  position: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type CreateFloorReq = {
  hall_id: string;
  name: string;
  is_private: boolean;
};

export type UpdateFloorReq = {
  name?: string;
  is_private?: boolean;
};

// ========== ROOM TYPES ==========
export type RoomType = "text" | "audio";

export type Room = {
  id: string;
  hall_id: string;
  floor_id: string | null;
  name: string;
  room_type: RoomType;
  position: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type CreateRoomReq = {
  hall_id: string;
  floor_id: string | null;
  name: string;
  room_type: RoomType;
  is_private?: boolean;
};

export type UpdateRoomReq = {
  name?: string;
  is_private?: boolean;
};

export type MoveRoomReq = {
  hall_id: string;
  new_floor_id: string | null;
  after_id: string | null;
};

export type FloorWithRooms = Floor & {
  rooms: Room[];
};

export type GetHallRoomsRes = {
  top_level: Room[];
  floors: FloorWithRooms[];
};

// ========== MESSAGE TYPES ==========
export type Attachment = {
  id: string;
  message_id: string;
  file_name: string;
  url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type AttachmentReq = {
  file_name: string;
  url: string;
  file_type?: string;
  file_size?: number;
};

export type Reaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type Message = {
  id: string;
  room_id: string;
  author_id: string;
  content: string;
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments?: Attachment[];
  reactions?: Reaction[];
  author?: UserMeRes;
  isOptimistic?: boolean;
};

export type CreateMessageReq = {
  content: string;
  attachments?: {
    file_name: string;
    url: string;
    file_type: string;
    file_size: number;
  }[];
};

export type UpdateMessageReq = {
  content: string;
};

export type MessagesResponse = {
  messages: Message[];
  has_more: boolean;
};

// Message cursor pagination
export type FetchMessagesOpts = {
  limit?: number;
  before?: string; // message ID to fetch messages before
  after?: string; // message ID to fetch messages after
  around?: string; // message ID to fetch messages around
};

// ========== ROLE & PERMISSION TYPES ==========
export type RolePermission = {
  role_id: string;
  admin: boolean;
  create_hall: boolean;
  manage_members: boolean;
  manage_roles: boolean;
  manage_bans: boolean;
  create_invites: boolean;
  create_floor: boolean;
  delete_floor: boolean;
  create_room: boolean;
  delete_room: boolean;
  manage_messages: boolean;
  send_messages: boolean;
  mention_everyone: boolean;
  read_messages: boolean;
  read_reactions: boolean;
  react_to_messages: boolean;
  attach_files: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type Role = {
  id: string;
  hall_id: string;
  name: string;
  color: string;
  is_admin: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  access_token?: string;
};

export type CreateRoleReq = {
  name: string;
  color?: string;
  is_admin?: boolean;
};

export type UpdateRoleReq = {
  name?: string;
  color?: string;
};

export type UpdateRolePermissionsReq = Partial<Omit<RolePermission, "role_id" | "created_at" | "updated_at">>;

// ========== HALL MEMBER TYPES ==========
export type HallMember = {
  hall_id: string;
  user_id: string;
  role_id: string;
  nickname: string | null;
  joined_at: string;
  updated_at: string;
  user?: UserMeRes;
};

export type UpdateHallMemberReq = {
  role_id?: string;
  nickname?: string | null;
};

// ========== BAN TYPES ==========
export type HallBan = {
  hall_id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  banned_at: string;
};

export type CreateBanReq = {
  user_id: string;
  reason?: string;
};

// ========== INVITE TYPES ==========
export type HallInvite = {
  code: string;
  hall_id: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
};

export type CreateInviteReq = {
  expires_at?: string;
  max_uses?: number;
};

export type InviteInfo = {
  code: string;
  hall_id: string;
  hall_name: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
};

// ========== WEBSOCKET MESSAGE TYPES ==========
export type WSBaseMessage = {
  room_id: string;
  author_id: string;
  sent_at: string;
};

export type WSTextMessage = WSBaseMessage & {
  type: "text";
  id?: string;
  content: string;
  mention_everyone?: boolean;
  mentions?: string[];
  attachments?: Attachment[];
  created_at?: string;
  updated_at?: string;
  edited_at?: string | null;
  deleted_at?: string | null;
};

export type WSTypingMessage = WSBaseMessage & {
  type: "typing";
  typing_user: string;
};

export type WSStopTypingMessage = WSBaseMessage & {
  type: "stop_typing";
};

export type WSJoinMessage = WSBaseMessage & {
  type: "join";
};

export type WSLeaveMessage = WSBaseMessage & {
  type: "leave";
};

export type WSErrorMessage = WSBaseMessage & {
  type: "error";
  error: string;
};

export type WSMessage =
  | WSTextMessage
  | WSTypingMessage
  | WSStopTypingMessage
  | WSJoinMessage
  | WSLeaveMessage
  | WSErrorMessage;

// Client-side outgoing message shape
export type WSSendTextMessage = {
  type: "text";
  room_id: string;
  content: string;
  sent_at: string;
  mention_everyone?: boolean;
  mentions?: string[];
  attachments?: Omit<AttachmentReq, "id">[];
};

// ========== ERROR TYPES ==========
export type AppError = {
  code: number;
  message: string;
};

// Auth Functions

export async function authSignIn(payload: SignInReq): Promise<SignInRes> {
  try {
    console.log("[AuthSignIn] Starting signin with email:", payload.email);
    console.log("[AuthSignIn] API Base:", apiBase);

    // Signin is special because the token is in the envelope, not the data field
    // We use a manual fetch/request here to avoid the automatic "data" unwrapping
    const backendUrl = `${apiBase}/auth/signin`;
    const res = await fetch(isProxyEnabled ? `/api/proxy?path=${encodeURIComponent("/auth/signin")}` : backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(payload),
      credentials: "include", // Ensure cookies are handled
    });

    const body = await res.json();
    console.log("[AuthSignIn] Raw Response body:", body);

    if (!res.ok) {
      throw new Error(body.message || body.error || "Signin failed");
    }

    // Capture token from the custom proxy header (extracted from HttpOnly cookie)
    const accessToken = res.headers.get("X-Yapp-Token") || body.data?.access_token || body.access_token;

    // Combine the fields for the frontend SignInRes type
    const result: SignInRes = {
      ...(body.data?.user_me || body.data || {}),
      success: body.success,
      message: body.message,
    };

    if (accessToken) {
      console.log("[AuthSignIn] Token found in header/body. Storing in localStorage.");
      localStorage.setItem("yapp_access_token", accessToken);
    } else {
      console.warn("[AuthSignIn] No token found in X-Yapp-Token header or response body!");
    }

    console.log("[AuthSignIn] Processed result. Token found:", !!result.access_token);

    // Ensure result object has required fields
    if (!result || typeof result !== "object" || !result.id) {
      console.error("[AuthSignIn] Invalid response - missing id field:", result);
      return {
        id: "",
        username: "",
        display_name: "",
        email: "",
        phone_number: null,
        avatar_url: null,
        avatar_thumbnail_url: null,
        description: null,
        friend_policy: "",
        created_at: "",
        updated_at: "",
        active: false,
        success: false,
        message: "Invalid response from server - missing user ID",
      };
    }

    console.log("[AuthSignIn] Signin successful for user:", result.username);
    return result;
  } catch (err: unknown) {
    // Convert thrown errors into a structured response
    const message = err instanceof Error ? err.message : "Sign in failed due to server error";
    console.error("[AuthSignIn] Error:", message, err);
    return {
      id: "",
      username: "",
      display_name: "",
      email: "",
      phone_number: null,
      avatar_url: null,
      avatar_thumbnail_url: null,
      description: null,
      friend_policy: "",
      created_at: "",
      updated_at: "",
      active: false,
      success: false,
      message,
    };
  }
}

export async function authSignUp(payload: SignUpReq): Promise<SignUpRes> {
  try {
    const result = await request<SignUpRes>(`${apiBase}/auth/signup`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!result || typeof result !== "object") {
      return {
        success: false,
        message: "Invalid response from server",
      };
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Sign up failed",
    };
  }
}

export async function authSignOut(): Promise<{ message?: string } | undefined> {
  try {
    return request<{ message?: string }>(`${apiBase}/auth/signout`, {
      method: "GET",
    });
  } catch (err: unknown) {
    return { message: err instanceof Error ? err.message : "Sign out failed" };
  }
}

// User functions
export async function getUserMe(): Promise<UserMeRes | null> {
  try {
    // We use request helper here because it's reliable for CSRF and proxying
    const result = await request<UserMeRes>(`${protectedApiBase}/me/`, {
      method: "GET",
    });

    // We don't strictly need to extract the token here because authSignIn already did it
    // But we check localStorage to ensure it's there
    const token = localStorage.getItem("yapp_access_token");
    if (result && token) {
      return { ...result, access_token: token };
    }

    return result;
  } catch (error) {
    console.error("[GetUserMe] Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserMe(
  payload: UpdateUserMeReq | null,
): Promise<UpdateUserMeRes | null> {
  try {
    return await request<UpdateUserMeRes>(`${protectedApiBase}/me/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("User update failed.:", error);
    return null;
  }
}

export async function getUser(userId: string): Promise<UserMeRes | null> {
  try {
    return await request<UserMeRes>(`${protectedApiBase}/users/${userId}`, {
      method: "GET",
    });
  } catch (error) {
    console.log("User fetch failed.:", error);
    return null;
  }
}

// Hall functions
export async function createHall(payload: CreateHallReq): Promise<Hall | null> {
  try {
    return await request<Hall>(`${protectedApiBase}/halls/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Hall not created:", error);
    return null;
  }
}

export async function getUserHalls(): Promise<Hall[] | null> {
  try {
    return await request<Hall[]>(`${protectedApiBase}/halls/`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Hall fetch failed:", error);
    return null;
  }
}

export async function getHall(hallId: string): Promise<Hall | null> {
  try {
    return await request<Hall>(`${protectedApiBase}/halls/${hallId}`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Hall fetch failed:", error);
    return null;
  }
}

export async function updateHall(
  hallId: string,
  payload: UpdateHallReq,
): Promise<Hall | null> {
  try {
    return await request<Hall>(`${protectedApiBase}/halls/${hallId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Hall update failed:", error);
    return null;
  }
}

export async function deleteHall(hallId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(`${protectedApiBase}/halls/${hallId}`, {
      method: "DELETE",
    });
    return true;
  } catch (error) {
    console.log("Hall delete failed:", error);
    return false;
  }
}

export async function joinHall(hallId: string): Promise<HallMember | null> {
  try {
    return await request<HallMember>(
      `${protectedApiBase}/halls/${hallId}/join`,
      {
        method: "POST",
      },
    );
  } catch (error) {
    console.log("Hall join failed:", error);
    return null;
  }
}

export async function leaveHall(hallId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/leave`,
      {
        method: "POST",
      },
    );
    return true;
  } catch (error) {
    console.log("Hall leave failed:", error);
    return false;
  }
}

// ========== FLOOR FUNCTIONS ==========
export async function getFloors(hallId: string): Promise<Floor[] | null> {
  try {
    return await request<Floor[]>(`${protectedApiBase}/halls/${hallId}/floors`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Floor fetch failed:", error);
    return null;
  }
}

export async function createFloor(
  hallId: string,
  payload: CreateFloorReq,
): Promise<Floor | null> {
  try {
    return await request<Floor>(`${protectedApiBase}/halls/${hallId}/floors`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Floor create failed:", error);
    return null;
  }
}

export async function updateFloor(
  hallId: string,
  floorId: string,
  payload: UpdateFloorReq,
): Promise<Floor | null> {
  try {
    return await request<Floor>(
      `${protectedApiBase}/halls/${hallId}/floors/${floorId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Floor update failed:", error);
    return null;
  }
}

export async function deleteFloor(
  hallId: string,
  floorId: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/floors/${floorId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Floor delete failed:", error);
    return false;
  }
}

// ========== ROOM FUNCTIONS ==========
export async function getRooms(hallId: string): Promise<GetHallRoomsRes | null> {
  try {
    return await request<GetHallRoomsRes>(
      `${protectedApiBase}/halls/${hallId}/rooms`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.log("Room fetch failed:", error);
    return null;
  }
}

export async function createRoom(
  hallId: string,
  payload: CreateRoomReq,
): Promise<Room | null> {
  try {
    return await request<Room>(`${protectedApiBase}/halls/${hallId}/rooms`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Room create failed:", error);
    return null;
  }
}

export async function updateRoom(
  hallId: string,
  roomId: string,
  payload: UpdateRoomReq,
): Promise<Room | null> {
  try {
    return await request<Room>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Room update failed:", error);
    return null;
  }
}

export async function deleteRoom(
  hallId: string,
  roomId: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Room delete failed:", error);
    return false;
  }
}

export async function moveRoom(
  hallId: string,
  roomId: string,
  payload: MoveRoomReq,
): Promise<Room | null> {
  try {
    return await request<Room>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/move`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Room move failed:", error);
    return null;
  }
}

// ========== MESSAGE FUNCTIONS ==========
export async function getMessages(
  hallId: string,
  roomId: string,
  opts?: FetchMessagesOpts,
): Promise<MessagesResponse | null> {
  try {
    const searchParams = new URLSearchParams();
    if (opts?.limit) searchParams.append("limit", opts.limit.toString());
    if (opts?.before) searchParams.append("before", opts.before);
    if (opts?.after) searchParams.append("after", opts.after);
    if (opts?.around) searchParams.append("around", opts.around);

    const query = searchParams.toString();
    const url = `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages${query ? "?" + query : ""}`;

    return await request<MessagesResponse>(url, {
      method: "GET",
    });
  } catch (error) {
    console.log("Message fetch failed:", error);
    return null;
  }
}

export async function getMessage(
  hallId: string,
  roomId: string,
  messageId: string,
): Promise<Message | null> {
  try {
    return await request<Message>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages/${messageId}`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.log("Message fetch failed:", error);
    return null;
  }
}

export async function createMessage(
  hallId: string,
  roomId: string,
  payload: CreateMessageReq,
): Promise<Message | null> {
  try {
    return await request<Message>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Message create failed:", error);
    return null;
  }
}

export async function updateMessage(
  hallId: string,
  roomId: string,
  messageId: string,
  payload: UpdateMessageReq,
): Promise<Message | null> {
  try {
    return await request<Message>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages/${messageId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Message update failed:", error);
    return null;
  }
}

export async function deleteMessage(
  hallId: string,
  roomId: string,
  messageId: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages/${messageId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Message delete failed:", error);
    return false;
  }
}

// ========== REACTION FUNCTIONS ==========
export async function addReaction(
  hallId: string,
  roomId: string,
  messageId: string,
  emoji: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages/${messageId}/reactions`,
      {
        method: "POST",
        body: JSON.stringify({ emoji }),
      },
    );
    return true;
  } catch (error) {
    console.log("Reaction add failed:", error);
    return false;
  }
}

export async function removeReaction(
  hallId: string,
  roomId: string,
  messageId: string,
  emoji: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/rooms/${roomId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Reaction remove failed:", error);
    return false;
  }
}

// ========== HALL MEMBER FUNCTIONS ==========
export async function getHallMembers(
  hallId: string,
): Promise<{ members: HallMember[]; total: number } | null> {
  try {
    return await request<{ members: HallMember[]; total: number }>(
      `${protectedApiBase}/halls/${hallId}/settings/members`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.log("Hall members fetch failed:", error);
    return null;
  }
}

export async function updateHallMember(
  hallId: string,
  userId: string,
  payload: UpdateHallMemberReq,
): Promise<HallMember | null> {
  try {
    return await request<HallMember>(
      `${protectedApiBase}/halls/${hallId}/settings/members/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Hall member update failed:", error);
    return null;
  }
}

export async function kickHallMember(
  hallId: string,
  userId: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/settings/members/${userId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Hall member kick failed:", error);
    return false;
  }
}

// ========== ROLE FUNCTIONS ==========
export async function getRoles(hallId: string): Promise<Role[] | null> {
  try {
    return await request<Role[]>(`${protectedApiBase}/halls/${hallId}/settings/roles`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Roles fetch failed:", error);
    return null;
  }
}

export async function createRole(
  hallId: string,
  payload: CreateRoleReq,
): Promise<Role | null> {
  try {
    return await request<Role>(`${protectedApiBase}/halls/${hallId}/settings/roles`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.log("Role create failed:", error);
    return null;
  }
}

export async function updateRole(
  hallId: string,
  roleId: string,
  payload: UpdateRoleReq,
): Promise<Role | null> {
  try {
    return await request<Role>(
      `${protectedApiBase}/halls/${hallId}/settings/roles/${roleId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Role update failed:", error);
    return null;
  }
}

export async function deleteRole(hallId: string, roleId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/settings/roles/${roleId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Role delete failed:", error);
    return false;
  }
}

export async function getRolePermissions(
  hallId: string,
  roleId: string,
): Promise<RolePermission | null> {
  try {
    return await request<RolePermission>(
      `${protectedApiBase}/halls/${hallId}/settings/roles/${roleId}/permissions`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.log("Role permissions fetch failed:", error);
    return null;
  }
}

export async function updateRolePermissions(
  hallId: string,
  roleId: string,
  payload: UpdateRolePermissionsReq,
): Promise<RolePermission | null> {
  try {
    return await request<RolePermission>(
      `${protectedApiBase}/halls/${hallId}/settings/roles/${roleId}/permissions`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Role permissions update failed:", error);
    return null;
  }
}

// ========== BAN FUNCTIONS ==========
export async function getHallBans(hallId: string): Promise<HallBan[] | null> {
  try {
    return await request<HallBan[]>(`${protectedApiBase}/halls/${hallId}/settings/bans`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Hall bans fetch failed:", error);
    return null;
  }
}

export async function banUser(
  hallId: string,
  payload: CreateBanReq,
): Promise<HallBan | null> {
  try {
    return await request<HallBan>(
      `${protectedApiBase}/halls/${hallId}/settings/bans`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Ban user failed:", error);
    return null;
  }
}

export async function unbanUser(hallId: string, userId: string): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/settings/bans/${userId}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Unban user failed:", error);
    return false;
  }
}

// ========== INVITE FUNCTIONS ==========
export async function getHallInvites(hallId: string): Promise<HallInvite[] | null> {
  try {
    return await request<HallInvite[]>(
      `${protectedApiBase}/halls/${hallId}/settings/invites`,
      {
        method: "GET",
      },
    );
  } catch (error) {
    console.log("Hall invites fetch failed:", error);
    return null;
  }
}

export async function createInvite(
  hallId: string,
  payload: CreateInviteReq,
): Promise<HallInvite | null> {
  try {
    return await request<HallInvite>(
      `${protectedApiBase}/halls/${hallId}/settings/invites`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.log("Invite create failed:", error);
    return null;
  }
}

export async function revokeInvite(
  hallId: string,
  inviteCode: string,
): Promise<boolean> {
  try {
    await request<{ message: string }>(
      `${protectedApiBase}/halls/${hallId}/settings/invites/${inviteCode}`,
      {
        method: "DELETE",
      },
    );
    return true;
  } catch (error) {
    console.log("Invite revoke failed:", error);
    return false;
  }
}

// Public invite endpoint (no auth required)
export async function getPublicInviteInfo(inviteCode: string): Promise<InviteInfo | null> {
  try {
    return await request<InviteInfo>(`${protectedApiBase}/invites/${inviteCode}`, {
      method: "GET",
    });
  } catch (error) {
    console.log("Public invite fetch failed:", error);
    return null;
  }
}

export async function acceptInvite(inviteCode: string): Promise<Hall | null> {
  try {
    return await request<Hall>(`${protectedApiBase}/invites/${inviteCode}/accept`, {
      method: "POST",
    });
  } catch (error) {
    console.log("Invite accept failed:", error);
    return null;
  }
}

// ========== WEBSOCKET HELPER ==========
export function getWebSocketUrl(roomId: string): string {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  const wsBase = backendUrl.replace(/^http/, "ws");

  // Try to get token from user store if possible
  let token = "";
  try {
    if (typeof window !== "undefined") {
      // 1. Check dedicated key first (for speed/reliability)
      token = localStorage.getItem("yapp_access_token") || "";

      // 2. Check Zustand store if dedicated key is missing
      if (!token) {
        const userStorage = localStorage.getItem("user-storage");
        if (userStorage) {
          const parsed = JSON.parse(userStorage);
          token = parsed?.state?.user?.access_token || "";
        }
      }

      // 3. Check cookies as last resort
      if (!token) {
        const match = document.cookie.match(/(^| )access_token=([^;]+)/);
        if (match) {
          token = match[2];
        }
      }
    }
  } catch (e) {
    console.warn("[getWebSocketUrl] Failed to get token", e);
  }

  const finalUrl = `${wsBase}/ws/rooms/${roomId}${token ? `?token=${token}` : ""}`;

  if (typeof window !== 'undefined') {
    (window as any).__LAST_WS_URL = finalUrl;
    (window as any).__WS_TOKEN_FOUND = !!token;
  }

  console.log("[getWebSocketUrl] Room:", roomId, "Token Found:", !!token);
  return finalUrl;
}
