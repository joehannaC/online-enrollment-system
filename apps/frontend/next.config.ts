import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentFilePath =
    fileURLToPath(import.meta.url);

const currentDirectory =
    path.dirname(currentFilePath);

const workspaceRoot =
    path.resolve(
        currentDirectory,
        "../..",
    );

const authServiceUrl =
    process.env.AUTH_SERVICE_URL ??
    "http://127.0.0.1:4100";

const enrollmentServiceUrl =
    process.env.ENROLLMENT_SERVICE_URL ??
    "http://127.0.0.1:4101";

const gradeServiceUrl =
    process.env.GRADE_SERVICE_URL ??
    "http://127.0.0.1:4102";

const profileServiceUrl =
    process.env.PROFILE_SERVICE_URL ??
    "http://127.0.0.1:4103";

const nextConfig: NextConfig = {
    devIndicators: false,

    turbopack: {
        root: workspaceRoot,
    },

    async rewrites() {
        return [
            {
                source:
                    "/api/auth/:path*",

                destination:
                    `${authServiceUrl}/api/auth/:path*`,
            },

            {
                source:
                    "/api/students/grades",

                destination:
                    `${gradeServiceUrl}/api/students/grades`,
            },

            {
                source:
                    "/api/students/:path*",

                destination:
                    `${enrollmentServiceUrl}/api/students/:path*`,
            },

            {
                source:
                    "/api/faculty/:path*",

                destination:
                    `${gradeServiceUrl}/api/faculty/:path*`,
            },

            {
                source:
                    "/api/profiles/:path*",

                destination:
                    `${profileServiceUrl}/api/profiles/:path*`,
            },
        ];
    }
};

export default nextConfig;