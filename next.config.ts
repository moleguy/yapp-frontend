import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'files.edgestore.dev',
            },
        ],
    },
    allowedDevOrigins: [
        "inocencia-null-patchouly.ngrok-free.dev",
        "https://yappserver.onrender.com",
        "192.168.1.5"
    ],
};

export default nextConfig;
