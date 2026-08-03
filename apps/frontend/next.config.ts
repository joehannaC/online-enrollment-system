import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,

    turbopack: {
        root: path.resolve(
            __dirname,
            "../..",
        ),
    },

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination:
                    "http://127.0.0.1:4000/api/:path*",
            },
        ];
    },
};

export default nextConfig;