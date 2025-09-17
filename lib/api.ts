// Centralized REST client for calling the Go backend from the Next.js frontend
export const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080';

// Generic helpers
async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        credentials: 'include', // include cookies for auth
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJSON = contentType.includes('application/json');
    const body = isJSON ? await res.json() : await res.text();

    if (!res.ok) {
        let message: string | undefined;
        if (isJSON && body && typeof body === 'object') {
            // Backend uses { error: string, code: number, success: false }
            if ('error' in (body as any)) {
                message = (body as any).error as string;
            } else if ('message' in (body as any)) {
                message = (body as any).message as string;
            }
        }
        if (!message && typeof body === 'string' && body.trim()) {
            message = body;
        }
        throw new Error(message || res.statusText || 'Request failed');
    }

    return body as T;
}

// Auth Types
export type SigninReq = { email: string; password: string };
export type SigninRes = { id?: string; username?: string; success?: boolean } | { message?: string };

export type SignupReq = {
    username: string;
    password: string;
    email: string;
    display_name: string;
};
export type SignupRes = {
    id: string;
    username: string;
    success?: boolean;
} | { message?: string };

// User Profile Type
export type UserProfile = {
    username: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    active: boolean;
};

// Auth Functions
export async function authSignin(payload: SigninReq): Promise<SigninRes> {
    // Backend path: POST /auth/signin (sets httpOnly cookie)
    return request<SigninRes>(`${apiBase}/auth/signin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function authSignup(payload: SignupReq): Promise<SignupRes> {
    // Backend path: POST /auth/signup
    return request<SignupRes>(`${apiBase}/auth/signup`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function authSignout(): Promise<{ message?: string } | undefined> {
    // Backend path: GET /auth/signout (clears cookie)
    return request<{ message?: string }>(`${apiBase}/auth/signout`, {
        method: 'GET',
    });
}

// Get current user from JWT cookie
export async function getUser(): Promise<UserProfile | null> {
    try {
        // Backend path: GET /auth/me (protected with AuthMiddleware)
        return await request<UserProfile>(`${apiBase}/auth/me`);
    } catch (error) {
        // If request fails (401, etc.), user is not authenticated
        console.log('User not authenticated:', error);
        return null;
    }
}