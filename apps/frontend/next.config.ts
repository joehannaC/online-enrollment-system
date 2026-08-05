import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
    devIndicators: false,

    turbopack: {
        root: path.resolve(__dirname, "../.."),
    },

    async rewrites() {
        const gatewayUrl =
            process.env.API_GATEWAY_URL ??
            "http://127.0.0.1:4000";

        console.log(
            "[frontend] API Gateway target:",
            gatewayUrl,
        );

        return [
            {
                source: "/api/:path*",
                destination: `${gatewayUrl}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;