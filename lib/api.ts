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
    credentials: "include",
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
  try {
    const result = await request<SignInRes>(`${apiBase}/auth/signin`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Ensure result object
    if (!result || typeof result !== "object") {
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
        message: "Invalid response from server",
      };
    }

    return {
      ...result,
      success: result.success === true, // Only true if server said so
    };
  } catch (err: any) {
    // Convert thrown errors into a structured response
    const message = err?.message || "Sign in failed due to server error";
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

  return {
    ...result,
    success: result.success !== false,
  };
}

export async function authSignOut(): Promise<{ message?: string } | undefined> {
  return request<{ message?: string }>(`${apiBase}/auth/signout`, {
    method: "GET",
  });
}

// User functions
export async function getUserMe(): Promise<UserMeRes | null> {
  try {
    const result = await request<UserMeRes>(`${protectedApiBase}/me/`, {
      method: "GET",
    });
    console.log("getUserMe response:", result);
    return result;
  } catch (error) {
    console.log("getUserMe error:", error);
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
