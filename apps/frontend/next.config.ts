import type { NextConfig } from "next";
import path from "node:path";

const gatewayUrl =
    process.env.API_GATEWAY_URL ??
    "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
    devIndicators: false,

    allowedDevOrigins: [
        "172.20.10.4",
        "localhost",
    ],

    turbopack: {
        root: path.resolve(__dirname, "../.."),
    },

    async rewrites() {
        console.log(
            "[frontend] API Gateway target:",
            gatewayUrl,
        );

        return [
            {
                source: "/api/:path*",
                destination:
                    `${gatewayUrl}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;