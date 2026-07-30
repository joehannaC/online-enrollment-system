import "dotenv/config";

import { z } from "zod";

const environmentSchema = z.object({
    NODE_ENV: z
        .enum([
            "development",
            "test",
            "production",
        ])
        .default("development"),

    SERVICE_NAME: z
        .string()
        .min(1)
        .default("auth-service"),

    HTTP_HOST: z
        .string()
        .min(1)
        .default("0.0.0.0"),

    HTTP_PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(4100),

    GRPC_HOST: z
        .string()
        .min(1)
        .default("0.0.0.0"),

    GRPC_PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(5100),

    MONGODB_URI: z
        .string()
        .min(
            1,
            "MONGODB_URI is required",
        ),

    MONGODB_DATABASE: z
        .string()
        .min(1)
        .default("online_enrollment"),

    JWT_SECRET: z
        .string()
        .min(
            1,
            "JWT_SECRET is required",
        ),

    JWT_EXPIRES_IN: z
        .string()
        .min(1)
        .default("1h"),

    FRONTEND_URL: z
        .string()
        .url()
        .default("http://localhost:3001"),
});

const result = environmentSchema.safeParse(
    process.env,
);

if (!result.success) {
    console.error(
        "Invalid environment variables:",
    );

    for (const issue of result.error.issues) {
        const field =
            issue.path.join(".") ||
            "environment";

        console.error(
            `- ${field}: ${issue.message}`,
        );
    }

    process.exit(1);
}

export const env = result.data;

export type Environment =
    z.infer<typeof environmentSchema>;