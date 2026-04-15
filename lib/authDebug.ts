/**
 * Frontend Auth Debugging Utility
 * 
 * Add this to help debug auth issues:
 * 1. Open browser console
 * 2. Paste this entire file
 * 3. Run: window.authDebug.testAuth()
 */

const authDebug = {
    log: (title: string, data: unknown) => {
        console.log(
            `%c[AUTH DEBUG] ${title}`,
            "color: #0077d4; font-weight: bold; font-size: 12px;",
            data,
        );
    },

    error: (title: string, data: unknown) => {
        console.error(
            `%c[AUTH ERROR] ${title}`,
            "color: #d40077; font-weight: bold; font-size: 12px;",
            data,
        );
    },

    // Test 1: Check API base URL
    checkApiBase: () => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        authDebug.log("API Base URL", apiBase);
        if (!apiBase || apiBase === "http://localhost:8080") {
            authDebug.error(
                "API BASE",
                "Not configured to Render server. Current: " + apiBase,
            );
            return false;
        }
        return true;
    },

    // Test 2: Check cookies in browser
    checkCookies: () => {
        const cookies = document.cookie;
        authDebug.log("Cookies", cookies || "(empty)");
        if (!cookies.includes("jwt")) {
            authDebug.error(
                "JWT COOKIE",
                "No JWT cookie found. User may not be authenticated.",
            );
            return false;
        }
        return true;
    },

    // Test 3: Test CORS preflight
    testCorsPreFlight: async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE;
            const response = await fetch(`${apiBase}/health`, {
                method: "OPTIONS",
                headers: {
                    "Access-Control-Request-Method": "POST",
                    "Origin": window.location.origin,
                },
            });
            authDebug.log("CORS Preflight Response", response.headers);
            if (
                response.headers.get("Access-Control-Allow-Origin") === "*" ||
                response.headers.get("Access-Control-Allow-Origin") === window.location.origin
            ) {
                authDebug.log("CORS", "✅ CORS headers present");
                return true;
            } else {
                authDebug.error(
                    "CORS",
                    "CORS header missing: " +
                    response.headers.get("Access-Control-Allow-Origin"),
                );
                return false;
            }
        } catch (err) {
            authDebug.error("CORS Preflight", err);
            return false;
        }
    },

    // Test 4: Test health endpoint & get CSRF token
    testHealth: async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE;
            const response = await fetch(`${apiBase}/health`, {
                method: "GET",
                credentials: "include",
            });
            const csrfToken = response.headers.get("x-csrf-token");
            authDebug.log("Health Status", response.status);
            authDebug.log("CSRF Token", csrfToken || "(not provided)");
            return { ok: response.ok, csrfToken };
        } catch (err) {
            authDebug.error("Health Check", err);
            return { ok: false };
        }
    },

    // Test 5: Check auth context
    checkAuthContext: () => {
        try {
            // This requires the app to be running in a browser with React DevTools
            authDebug.log(
                "To check Auth Context",
                "Use React DevTools to inspect useAuth() hook in AuthProvider",
            );
            return true;
        } catch (err) {
            authDebug.error("Auth Context Check", err);
            return false;
        }
    },

    // Test 6: Detailed signup test
    testSignup: async (email: string, password: string, username: string, displayName: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE;
            const response = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                    display_name: displayName,
                }),
            });
            const data = await response.json();
            authDebug.log("Signup Response Status", response.status);
            authDebug.log("Signup Response Body", data);
            authDebug.log("Response Headers", {
                ContentType: response.headers.get("content-type"),
                SetCookie: response.headers.get("set-cookie"),
            });
            return { ok: response.ok, data };
        } catch (err) {
            authDebug.error("Signup Test", err);
            return { ok: false, error: err };
        }
    },

    // Test 7: Detailed signin test
    testSignin: async (email: string, password: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE;
            const response = await fetch(`${apiBase}/auth/signin`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            authDebug.log("Signin Response Status", response.status);
            authDebug.log("Signin Response Body", data);
            authDebug.log("Response Headers", {
                ContentType: response.headers.get("content-type"),
                SetCookie: response.headers.get("set-cookie"),
            });
            if (response.ok) {
                authDebug.log("JWT after signin:", document.cookie);
            }
            return { ok: response.ok, data };
        } catch (err) {
            authDebug.error("Signin Test", err);
            return { ok: false, error: err };
        }
    },

    // Test 8: Test protected route
    testProtectedRoute: async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE;
            const response = await fetch(`${apiBase}/api/v1/me/`, {
                method: "GET",
                credentials: "include",
            });
            const data = response.ok ? await response.json() : null;
            authDebug.log("Protected Route (/me) Status", response.status);
            authDebug.log("Protected Route Response", data);
            if (!response.ok) {
                authDebug.error(
                    "Protected Route",
                    `Status ${response.status}: User not authenticated or token invalid`,
                );
            }
            return { ok: response.ok, data };
        } catch (err) {
            authDebug.error("Protected Route Test", err);
            return { ok: false, error: err };
        }
    },

    // Test 9: Full auth flow
    runFullAuthTest: async () => {
        authDebug.log("Starting Full Auth Test", "================");

        // Step 1: Check config
        authDebug.log("Step 1: Checking configuration...", "");
        if (!authDebug.checkApiBase()) return;

        // Step 2: Test health
        authDebug.log("Step 2: Testing health endpoint...", "");
        await authDebug.testHealth();

        // Step 3: Test CORS
        authDebug.log("Step 3: Testing CORS...", "");
        await authDebug.testCorsPreFlight();

        // Step 4: Check existing cookies
        authDebug.log("Step 4: Checking existing cookies...", "");
        authDebug.checkCookies();

        authDebug.log(
            "Full Auth Test Complete",
            "Check console for results above",
        );
    },

    // Helper: Clear cookies
    clearCookies: () => {
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        authDebug.log("Cookies Cleared", "All cookies removed");
    },
};

// Export to window for console access
if (typeof window !== "undefined") {
    (window as Record<string, unknown>).authDebug = authDebug;
    console.log(
        "%c🔐 Auth Debug Tools Loaded!",
        "color: green; font-weight: bold; font-size: 14px;",
    );
    console.log(
        "Available commands:\n" +
        "  authDebug.runFullAuthTest()  - Run full auth test\n" +
        "  authDebug.testSignup()       - Test signup\n" +
        "  authDebug.testSignin()       - Test signin\n" +
        "  authDebug.testProtectedRoute() - Test /me endpoint\n" +
        "  authDebug.checkCookies()     - Show cookies\n" +
        "  authDebug.clearCookies()     - Clear all cookies",
    );
}

export default authDebug;
