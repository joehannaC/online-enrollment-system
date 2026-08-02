import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum([
            "development",
            "test",
            "production",
        ])
        .default("development"),

    SERVICE_NAME: z
        .string()
        .trim()
        .min(1)
        .default("api-gateway"),

    HTTP_HOST: z
        .string()
        .trim()
        .min(1)
        .default("0.0.0.0"),

    HTTP_PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(4000),

    /*
     * Backward-compatible single frontend origin.
     * Used when FRONTEND_URLS is not provided.
     */
    FRONTEND_URL: z
        .string()
        .trim()
        .url()
        .default(
            "http://localhost:3001",
        ),

    /*
     * Comma-separated frontend origins.
     *
     * Example:
     * http://localhost:3001,https://h61zcjl1-3001.asse.devtunnels.ms
     */
    FRONTEND_URLS: z
        .string()
        .trim()
        .optional(),

    AUTH_SERVICE_URL: z
        .string()
        .trim()
        .url()
        .default(
            "http://127.0.0.1:4100",
        ),

    ENROLLMENT_SERVICE_URL: z
        .string()
        .trim()
        .url()
        .default(
            "http://127.0.0.1:4101",
        ),

    GRADE_SERVICE_URL: z
        .string()
        .trim()
        .url()
        .default(
            "http://127.0.0.1:4102",
        ),

    PROFILE_SERVICE_URL: z
        .string()
        .trim()
        .url()
        .default(
            "http://127.0.0.1:4103",
        ),

    PROXY_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(15_000),
});

const result =
    envSchema.safeParse(
        process.env,
    );

if (!result.success) {
    const messages =
        result.error.issues.map(
            (issue) => {
                const field =
                    issue.path.join(
                        ".",
                    ) ||
                    "environment";

                return `- ${field}: ${issue.message}`;
            },
        );

    console.error(
        [
            "[api-gateway] Invalid environment configuration:",
            ...messages,
        ].join("\n"),
    );

    process.exit(1);
}

const parsedEnv =
    result.data;

const frontendOrigins =
    (
        parsedEnv.FRONTEND_URLS ??
        parsedEnv.FRONTEND_URL
    )
        .split(",")
        .map((origin) =>
            origin.trim(),
        )
        .filter(
            (origin) =>
                origin.length > 0,
        );

const invalidFrontendOrigins =
    frontendOrigins.filter(
        (origin) => {
            try {
                const url =
                    new URL(origin);

                return ![
                    "http:",
                    "https:",
                ].includes(
                    url.protocol,
                );
            } catch {
                return true;
            }
        },
    );

if (
    invalidFrontendOrigins.length >
    0
) {
    console.error(
        [
            "[api-gateway] Invalid FRONTEND_URLS configuration:",
            ...invalidFrontendOrigins.map(
                (origin) =>
                    `- ${origin}`,
            ),
        ].join("\n"),
    );

    process.exit(1);
}

if (
    frontendOrigins.length === 0
) {
    console.error(
        "[api-gateway] At least one frontend origin must be configured.",
    );

    process.exit(1);
}

export const env = {
    ...parsedEnv,

    FRONTEND_ORIGINS:
        frontendOrigins,
} as const;

export type Environment =
    typeof env;