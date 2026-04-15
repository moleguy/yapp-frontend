"use client";

import { useState, useEffect } from "react";

interface TestResult {
    name: string;
    status: string | number;
    ok?: boolean;
    duration: string;
    url: string;
    error?: string;
}

export default function TestPage() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function testConnectivity() {
            const tests = [];

            const backendUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

            // Test 1: Health check
            try {
                const start = performance.now();
                const res = await fetch(`${backendUrl}/health`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "ngrok-skip-browser-warning": "true" },
                });
                const duration = performance.now() - start;
                tests.push({
                    name: "GET /health",
                    status: res.status,
                    ok: res.ok,
                    duration: `${duration.toFixed(0)}ms`,
                    url: `${backendUrl}/health`,
                });
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                tests.push({
                    name: "GET /health",
                    status: "ERROR",
                    error: errorMsg,
                    duration: "N/A",
                    url: `${backendUrl}/health`,
                });
            }

            // Test 2: Auth signin endpoint (without credentials)
            try {
                const start = performance.now();
                const res = await fetch(`${backendUrl}/api/v1/auth/signin`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "true",
                    },
                    body: JSON.stringify({ email: "test@test.com", password: "test" }),
                });
                const duration = performance.now() - start;
                tests.push({
                    name: "POST /api/v1/auth/signin",
                    status: res.status,
                    ok: res.ok,
                    duration: `${duration.toFixed(0)}ms`,
                    url: `${backendUrl}/api/v1/auth/signin`,
                });
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                tests.push({
                    name: "POST /api/v1/auth/signin",
                    status: "ERROR",
                    error: errorMsg,
                    duration: "N/A",
                    url: `${backendUrl}/api/v1/auth/signin`,
                });
            }

            // Test 3: User me endpoint
            try {
                const start = performance.now();
                const res = await fetch(`${backendUrl}/api/v1/me/`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "ngrok-skip-browser-warning": "true" },
                });
                const duration = performance.now() - start;
                tests.push({
                    name: "GET /api/v1/me/",
                    status: res.status,
                    ok: res.ok,
                    duration: `${duration.toFixed(0)}ms`,
                    url: `${backendUrl}/api/v1/me/`,
                });
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                tests.push({
                    name: "GET /api/v1/me/",
                    status: "ERROR",
                    error: errorMsg,
                    duration: "N/A",
                    url: `${backendUrl}/api/v1/me/`,
                });
            }

            setResults(tests);
            setLoading(false);
        }

        testConnectivity();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Backend Connectivity Test</h1>

            <div className="mb-4">
                <p className="text-gray-600">Backend URL: {process.env.NEXT_PUBLIC_API_BASE}</p>
            </div>

            {loading ? (
                <p>Testing connectivity...</p>
            ) : (
                <div>
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Endpoint</th>
                                <th className="border p-2 text-left">Status</th>
                                <th className="border p-2 text-left">Duration</th>
                                <th className="border p-2 text-left">URL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, i) => (
                                <tr key={i} className={result.status === "ERROR" ? "bg-red-50" : ""}>
                                    <td className="border p-2">{result.name}</td>
                                    <td className="border p-2">
                                        {result.error ? (
                                            <span className="text-red-600 font-mono text-sm">{result.error}</span>
                                        ) : (
                                            <span className={result.ok ? "text-green-600" : "text-yellow-600"}>
                                                {result.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border p-2">{result.duration}</td>
                                    <td className="border p-2 text-sm text-gray-600">{result.url}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-gray-700">
                            <strong>Interpretation:</strong>
                            <ul className="list-disc pl-5 mt-2">
                                <li>✅ Status 200-299: Working</li>
                                <li>⚠️ Status 400-499: Request error (normal for GET /api/v1/me/ without auth)</li>
                                <li>❌ ERROR: Backend unreachable (CORS, network, or server down)</li>
                            </ul>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
