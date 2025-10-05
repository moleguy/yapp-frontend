// Centralized REST client for calling the Go backend from the Next.js frontend

export const apiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080";
export const protectedApiBase =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:8080/api";

// Generic helpers
async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: "include", // include cookies for auth
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const body = isJSON ? await res.json() : await res.text();

  if (!res.ok) {
    let message: string | undefined;
    if (isJSON && body && typeof body === "object") {
      // Backend uses { error: string, code: number, success: false }
      if ("error" in body) {
        message = (body as { error: string }).error;
      } else if ("message" in body) {
        message = (body as { message: string }).message;
      }
    }
    if (!message && typeof body === "string" && body.trim()) {
      message = body;
    }
    throw new Error(message || res.statusText || "Request failed");
  }

  return body as T;
}

// Auth Types
export type SignInReq = {
  email: string;
  password: string;
};
export type SignInRes =
  | {
      id?: string;
      username?: string;
      success?: boolean;
    }
  | { message?: string };

export type SignUpReq = {
  username: string;
  password: string;
  email: string;
  display_name: string;
};
export type SignUpRes =
  | {
      id: string;
      username: string;
      success?: boolean;
    }
  | { message?: string };

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

// Hall type
export type CreateHallReq = {
  name: string;
  icon_url: string | null;
  icon_thumbnail_url: string | null;
  banner_color: string | null;
  description: string | null;
};

export type Hall = {
  id: string;
  name: string;
  icon_url: string | null;
  icon_thumbnail_url: string | null;
  banner_color: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string;
};

// Auth Functions
export async function authSignIn(payload: SignInReq): Promise<SignInRes> {
  // Backend path: POST /auth/signin (sets httpOnly cookie)
  return request<SignInRes>(`${apiBase}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function authSignUp(payload: SignUpReq): Promise<SignUpRes> {
  // Backend path: POST /auth/signup
  return request<SignUpRes>(`${apiBase}/auth/signup`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function authSignOut(): Promise<{ message?: string } | undefined> {
  // Backend path: GET /auth/signout (clears cookie)
  return request<{ message?: string }>(`${apiBase}/auth/signout`, {
    method: "GET",
  });
}

// User functions

// Get current user from JWT cookie
export async function getUserMe(): Promise<UserMeRes | null> {
  try {
    // Backend path: GET /me/ (protected with AuthMiddleware)
    return await request<UserMeRes>(`${protectedApiBase}/me/`, {
      method: "GET",
    });
  } catch (error) {
    // If request fails (401, etc.), user is not authenticated
    console.log("User not authenticated:", error);
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
    // If request fails (401, etc.), user is not authenticated
    console.log("User update failed.:", error);
    return null;
  }
}

// Hall functions
export async function createHall(payload: CreateHallReq): Promise<Hall | null> {
  try {
    // Backend path: POST /halls/create (protected with AuthMiddleware)
    return await request<Hall>(`${protectedApiBase}/halls/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // If request fails (401, etc.), user is not authenticated
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
    // If request fails (401, etc.), user is not authenticated
    console.log("Hall fetch failed:", error);
    return null;
  }
}
