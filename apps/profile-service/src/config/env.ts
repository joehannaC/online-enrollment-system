import dotenv from "dotenv";
import path from "node:path";
import {
    fileURLToPath,
} from "node:url";

const currentFilePath =
    fileURLToPath(import.meta.url);

const currentDirectory =
    path.dirname(currentFilePath);

const environmentPath =
    path.resolve(
        currentDirectory,
        "../../.env",
    );

dotenv.config({
    path: environmentPath,
});

function getRequiredEnvironmentValue(
    name: string,
): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `[profile-service] Missing required environment variable: ${name}`,
        );
    }

    return value;
}

function getPort(
    name: string,
    fallback: number,
): number {
    const value =
        process.env[name];

    if (!value) {
        return fallback;
    }

    const parsedValue =
        Number(value);

    if (
        !Number.isInteger(parsedValue) ||
        parsedValue <= 0
    ) {
        throw new Error(
            `[profile-service] ${name} must be a valid port number.`,
        );
    }

    return parsedValue;
}

export const env = {
    SERVICE_NAME:
        process.env.SERVICE_NAME ??
        "profile-service",

    HTTP_HOST:
        process.env.HTTP_HOST ??
        "0.0.0.0",

    HTTP_PORT:
        getPort(
            "HTTP_PORT",
            4103,
        ),

    GRPC_HOST:
        process.env.GRPC_HOST ??
        "0.0.0.0",

    GRPC_PORT:
        getPort(
            "GRPC_PORT",
            5103,
        ),

    MONGODB_URI:
        getRequiredEnvironmentValue(
            "MONGODB_URI",
        ),

    MONGODB_DATABASE:
        process.env.MONGODB_DATABASE ??
        "online_enrollment",

    JWT_SECRET:
        getRequiredEnvironmentValue(
            "JWT_SECRET",
        ),

    FRONTEND_URL:
        process.env.FRONTEND_URL ??
        "http://localhost:3001",
} as const;