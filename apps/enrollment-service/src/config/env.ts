import dotenv from "dotenv";
import path from "node:path";
import {
    fileURLToPath,
} from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFilePath);

const environmentPath = path.resolve(
    currentDirectory,
    "../../.env",
);

const result = dotenv.config({
    path: environmentPath,
});

if (result.error) {
    console.warn(
        `[enrollment-service] Could not load environment file at ${environmentPath}`,
    );
}

function getRequiredEnvironmentValue(
    name: string,
): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `${name} is missing from apps/enrollment-service/.env`,
        );
    }

    return value;
}

function getNumberEnvironmentValue(
    name: string,
    fallback: number,
): number {
    const value = process.env[name];

    if (!value) {
        return fallback;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error(
            `${name} must be a positive integer.`,
        );
    }

    return parsedValue;
}

export const env = {
    SERVICE_NAME:
        process.env.SERVICE_NAME ??
        "enrollment-service",

    HTTP_HOST:
        process.env.HTTP_HOST ??
        "0.0.0.0",

    HTTP_PORT: getNumberEnvironmentValue(
        "HTTP_PORT",
        4101,
    ),

    GRPC_HOST:
        process.env.GRPC_HOST ??
        "0.0.0.0",

    GRPC_PORT: getNumberEnvironmentValue(
        "GRPC_PORT",
        5101,
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

    API_GATEWAY_URL:
        process.env.API_GATEWAY_URL ??
        "http://127.0.0.1:4000",

    REALTIME_INTERNAL_SECRET:
        getRequiredEnvironmentValue(
            "REALTIME_INTERNAL_SECRET",
        ),
} as const;