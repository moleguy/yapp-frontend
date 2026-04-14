// API proxy to bypass CORS issues during development
// Routes requests from http://localhost:3000/api/proxy?path=/auth/signin to the actual backend
// Fixed: Graceful decompression fallback for uncompressed responses
// Updated: Convert decompressed buffer to UTF-8 string for proper Response serialization

import { gunzip, brotliDecompress, inflate } from "node:zlib";

// Headers that should NOT be copied from backend response
const HEADERS_TO_EXCLUDE = new Set([
    "content-encoding", // We'll decompress, so don't pass this header
    "content-length", // Will be recalculated by Response
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

    // Only copy safe headers
    backendHeaders.forEach((value, key) => {
        if (!HEADERS_TO_EXCLUDE.has(key.toLowerCase())) {
            headers.set(key, value);
        }
    });

    // Always set content-type as application/json for API responses
    headers.set("Content-Type", "application/json");

    return headers;
}

/**
 * Decompress response body based on Content-Encoding header.
 * If decompression fails (e.g., content is already plain), returns original buffer.
 */
async function decompressResponseBody(
    encodingType: string | null,
    buffer: Buffer
): Promise<Buffer> {
    if (!encodingType) {
        return buffer;
    }

    const encoding = encodingType.toLowerCase().trim();

    return new Promise((resolve) => {
        if (encoding === "gzip") {
            gunzip(buffer, (err: Error | null, decompressed: Buffer) => {
                if (err) {
                    // Content isn't actually gzipped, return original
                    resolve(buffer);
                } else {
                    resolve(decompressed);
                }
            });
        } else if (encoding === "br") {
            brotliDecompress(buffer, (err: Error | null, decompressed: Buffer) => {
                if (err) {
                    // Content isn't actually brotli compressed, return original
                    resolve(buffer);
                } else {
                    resolve(decompressed);
                }
            });
        } else if (encoding === "deflate") {
            inflate(buffer, (err: Error | null, decompressed: Buffer) => {
                if (err) {
                    // Content isn't actually deflated, return original
                    resolve(buffer);
                } else {
                    resolve(decompressed);
                }
            });
        } else {
            // Unknown encoding, return as-is
            resolve(buffer);
        }
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const targetUrl = `${backendUrl}${path}`;

    console.log("[Proxy] GET", targetUrl);

    try {
        const res = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "ngrok-skip-browser-warning": "true",
                Cookie: request.headers.get("cookie") || "",
            },
        });

        // Get response body and check encoding
        const encoding = res.headers.get("content-encoding");
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Decompress if needed (gracefully handles both compressed and uncompressed)
        const decompressed = await decompressResponseBody(encoding, buffer);
        const bodyString = decompressed.toString('utf8');

        console.log("[Proxy] Decompressed buffer size:", decompressed.length, "bytes");
        console.log("[Proxy] Body string length:", bodyString.length, "chars");
        console.log("[Proxy] Body preview:", bodyString.substring(0, 300));
        console.log("[Proxy] Response status:", res.status, "Content-Type:", res.headers.get("content-type"), "Content-Encoding:", encoding);

        const headers = createSafeHeaders(res.headers);

        // Copy set-cookie if present and modify for proxy domain
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            console.log("[Proxy] GET Set-Cookie:", setCookie.substring(0, 100));
            // Remove Domain attribute to make it work with localhost:3000
            let modifiedCookie = setCookie
                .split(';')
                .filter(part => !part.trim().toLowerCase().startsWith('domain='))
                .join(';');
            // Ensure Path is set to /
            if (!modifiedCookie.toLowerCase().includes('path=')) {
                modifiedCookie += '; Path=/';
            }
            headers.set("set-cookie", modifiedCookie);
        }

        return new Response(bodyString, {
            status: res.status,
            statusText: res.statusText,
            headers,
        });
    } catch (error: any) {
        console.error("[Proxy] GET error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const targetUrl = `${backendUrl}${path}`;

    console.log("[Proxy] POST", targetUrl);

    try {
        const body = await request.text();

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "ngrok-skip-browser-warning": "true",
                Cookie: request.headers.get("cookie") || "",
            },
            body,
        });

        // Get response body and check encoding
        const encoding = res.headers.get("content-encoding");
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Decompress if needed (gracefully handles both compressed and uncompressed)
        const decompressed = await decompressResponseBody(encoding, buffer);
        const bodyString = decompressed.toString('utf8');

        console.log("[Proxy] Decompressed buffer size:", decompressed.length, "bytes");
        console.log("[Proxy] Body string length:", bodyString.length, "chars");
        console.log("[Proxy] Body preview:", bodyString.substring(0, 300));
        console.log("[Proxy] Response status:", res.status, "Content-Type:", res.headers.get("content-type"), "Content-Encoding:", encoding);

        const headers = createSafeHeaders(res.headers);

        // Copy CSRF token if present
        const csrfToken = res.headers.get("x-csrf-token");
        if (csrfToken) {
            headers.set("x-csrf-token", csrfToken);
        }

        // Copy set-cookie if present (for JWT)
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            console.log("[Proxy] Raw Set-Cookie header:", setCookie);
            // Modify the cookie to work with our proxy domain
            // Remove Domain attribute to make it work with localhost:3000
            let modifiedCookie = setCookie
                .split(';')
                .filter(part => !part.trim().toLowerCase().startsWith('domain='))
                .join(';');
            // Ensure Path is set to /
            if (!modifiedCookie.toLowerCase().includes('path=')) {
                modifiedCookie += '; Path=/';
            }
            console.log("[Proxy] Modified Set-Cookie:", modifiedCookie);
            headers.set("set-cookie", modifiedCookie);
        }

        return new Response(bodyString, {
            status: res.status,
            statusText: res.statusText,
            headers,
        });
    } catch (error: any) {
        console.error("[Proxy] POST error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const targetUrl = `${backendUrl}${path}`;

    console.log("[Proxy] PATCH", targetUrl);

    try {
        const body = await request.text();

        const res = await fetch(targetUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "ngrok-skip-browser-warning": "true",
                Cookie: request.headers.get("cookie") || "",
            },
            body,
        });

        // Get response body and check encoding
        const encoding = res.headers.get("content-encoding");
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Decompress if needed (gracefully handles both compressed and uncompressed)
        const decompressed = await decompressResponseBody(encoding, buffer);
        const bodyString = decompressed.toString('utf8');

        console.log("[Proxy] Response status:", res.status, "Content-Type:", res.headers.get("content-type"), "Content-Encoding:", encoding);

        const headers = createSafeHeaders(res.headers);

        // Copy CSRF token if present
        const csrfToken = res.headers.get("x-csrf-token");
        if (csrfToken) {
            headers.set("x-csrf-token", csrfToken);
        }

        // Copy set-cookie if present and modify for proxy domain
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            console.log("[Proxy] PATCH Set-Cookie:", setCookie.substring(0, 100));
            let modifiedCookie = setCookie
                .split(';')
                .filter(part => !part.trim().toLowerCase().startsWith('domain='))
                .join(';');
            if (!modifiedCookie.toLowerCase().includes('path=')) {
                modifiedCookie += '; Path=/';
            }
            headers.set("set-cookie", modifiedCookie);
        }

        return new Response(bodyString, {
            status: res.status,
            statusText: res.statusText,
            headers,
        });
    } catch (error: any) {
        console.error("[Proxy] PATCH error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
        );
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
        return new Response(JSON.stringify({ error: "Missing path" }), { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    const targetUrl = `${backendUrl}${path}`;

    console.log("[Proxy] DELETE", targetUrl);

    try {
        const res = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "ngrok-skip-browser-warning": "true",
                Cookie: request.headers.get("cookie") || "",
            },
        });

        // Get response body and check encoding
        const encoding = res.headers.get("content-encoding");
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Decompress if needed (gracefully handles both compressed and uncompressed)
        const decompressed = await decompressResponseBody(encoding, buffer);
        const bodyString = decompressed.toString('utf8');

        console.log("[Proxy] Response status:", res.status, "Content-Type:", res.headers.get("content-type"), "Content-Encoding:", encoding);

        const headers = createSafeHeaders(res.headers);

        // Copy CSRF token if present
        const csrfToken = res.headers.get("x-csrf-token");
        if (csrfToken) {
            headers.set("x-csrf-token", csrfToken);
        }

        // Copy set-cookie if present and modify for proxy domain
        const setCookie = res.headers.get("set-cookie");
        if (setCookie) {
            console.log("[Proxy] DELETE Set-Cookie:", setCookie.substring(0, 100));
            let modifiedCookie = setCookie
                .split(';')
                .filter(part => !part.trim().toLowerCase().startsWith('domain='))
                .join(';');
            if (!modifiedCookie.toLowerCase().includes('path=')) {
                modifiedCookie += '; Path=/';
            }
            headers.set("set-cookie", modifiedCookie);
        }

        return new Response(bodyString, {
            status: res.status,
            statusText: res.statusText,
            headers,
        });
    } catch (error: any) {
        console.error("[Proxy] DELETE error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 502, headers: { "Content-Type": "application/json" } }
        );
    }
}
