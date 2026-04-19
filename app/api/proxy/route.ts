// API proxy to bypass CORS issues during development
// Routes requests from http://localhost:3000/api/proxy?path=/auth/signin to the actual backend
// Fixed: Graceful decompression fallback for uncompressed responses
// Updated: Convert decompressed buffer to UTF-8 string for proper Response serialization

import { gunzip, brotliDecompress, inflate } from "node:zlib";

const HEADERS_TO_EXCLUDE = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
]);

function createSafeHeaders(backendHeaders: Headers): Headers {
    const headers = new Headers();
    backendHeaders.forEach((value, key) => {
        if (!HEADERS_TO_EXCLUDE.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    headers.set("Content-Type", "application/json");
    return headers;
}

async function decompressResponseBody(encodingType: string | null, buffer: Buffer): Promise<Buffer> {
    if (!encodingType) return buffer;
    const encoding = encodingType.toLowerCase().trim();
    return new Promise((resolve) => {
        if (encoding === "gzip") {
            gunzip(buffer, (err, d) => resolve(err ? buffer : d));
        } else if (encoding === "br") {
            brotliDecompress(buffer, (err, d) => resolve(err ? buffer : d));
        } else if (encoding === "deflate") {
            inflate(buffer, (err, d) => resolve(err ? buffer : d));
        } else {
            resolve(buffer);
        }
    });
}

/** Extract JWT from cookie string, build Authorization header */
function extractAuthHeader(request: Request): string {
    // Prefer Authorization header passed directly
    const authHeader = request.headers.get("authorization");
    if (authHeader) return authHeader;

    // Fall back to JWT cookie
    const cookie = request.headers.get("cookie") || "";
    const match = cookie.match(/jwt=([^;]+)/);
    return match ? `Bearer ${match[1]}` : "";
}

/** Forward cookie + set-cookie handling, JWT extraction */
function applySetCookie(res: Response, headers: Headers): void {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return;

    const jwtMatch = setCookie.match(/jwt=([^;]+)/);
    if (jwtMatch?.[1]) {
        headers.set("X-Yapp-Token", jwtMatch[1]);
    }

    let modifiedCookie = setCookie
        .split(";")
        .filter((p) => !p.trim().toLowerCase().startsWith("domain="))
        .join(";");
    if (!modifiedCookie.toLowerCase().includes("path=")) {
        modifiedCookie += "; Path=/";
    }
    headers.set("set-cookie", modifiedCookie);
}

/** Shared proxy logic for all methods */
async function proxyRequest(request: Request, method: string, body?: string): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), { status: 400 });
    }

    const backendUrl = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080").replace(/\/+$/, "");
    const targetUrl = `${backendUrl}${path}`;

    console.log(`[Proxy] ${method}`, targetUrl);

    try {
        const authHeader = extractAuthHeader(request);

        const res = await fetch(targetUrl, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "ngrok-skip-browser-warning": "true",
                Cookie: request.headers.get("cookie") || "",
                ...(authHeader ? { Authorization: authHeader } : {}),
                // Forward CSRF token if present
                ...(request.headers.get("x-csrf-token")
                    ? { "X-CSRF-Token": request.headers.get("x-csrf-token")! }
                    : {}),
            },
            ...(body !== undefined ? { body } : {}),
        });

        const encoding = res.headers.get("content-encoding");
        const buffer = Buffer.from(await res.arrayBuffer());
        const decompressed = await decompressResponseBody(encoding, buffer);
        const bodyString = decompressed.toString("utf8");

        console.log(`[Proxy] ${res.status} ← ${method} ${path}`);

        const headers = createSafeHeaders(res.headers);

        // Forward CSRF token from backend
        const csrfToken = res.headers.get("x-csrf-token");
        if (csrfToken) headers.set("x-csrf-token", csrfToken);

        // Handle set-cookie + JWT extraction
        applySetCookie(res, headers);

        // Also echo back any JWT already in the incoming request cookies
        const reqJwtMatch = (request.headers.get("cookie") || "").match(/jwt=([^;]+)/);
        if (reqJwtMatch?.[1] && !headers.get("X-Yapp-Token")) {
            headers.set("X-Yapp-Token", reqJwtMatch[1]);
        }

        return new Response(bodyString, {
            status: res.status,
            statusText: res.statusText,
            headers,
        });
    } catch (error: unknown) {
        console.error(`[Proxy] ${method} error:`, error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
            { status: 502, headers: { "Content-Type": "application/json" } },
        );
    }
}

export async function GET(request: Request) {
    return proxyRequest(request, "GET");
}

export async function POST(request: Request) {
    return proxyRequest(request, "POST", await request.text());
}

export async function PATCH(request: Request) {
    return proxyRequest(request, "PATCH", await request.text());
}

export async function DELETE(request: Request) {
    return proxyRequest(request, "DELETE");
}