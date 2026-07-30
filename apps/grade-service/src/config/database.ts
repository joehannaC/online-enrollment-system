import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(
            env.MONGODB_URI,
            {
                dbName:
                    env.MONGODB_DATABASE,

                serverSelectionTimeoutMS:
                    10_000,

                connectTimeoutMS:
                    10_000,

                socketTimeoutMS:
                    45_000,

                maxPoolSize: 20,

                minPoolSize: 1,
            },
        );

        console.log(
            `[${env.SERVICE_NAME}] MongoDB connection established`,
        );
    } catch (error) {
        console.error(
            `[${env.SERVICE_NAME}] MongoDB connection failed`,
            error,
        );

        throw error;
    }
}

export async function disconnectDatabase(): Promise<void> {
    if (
        mongoose.connection.readyState === 0
    ) {
        return;
    }

    await mongoose.disconnect();

    console.log(
        `[${env.SERVICE_NAME}] MongoDB connection closed`,
    );
}

/**
 * Returns the native MongoDB database instance.
 *
 * Use this when accessing collections directly:
 * getDatabase().collection("courses")
 */
export function getDatabase() {
    const database =
        mongoose.connection.db;

    if (
        !isDatabaseConnected() ||
        !database
    ) {
        throw new Error(
            `[${env.SERVICE_NAME}] MongoDB is not connected`,
        );
    }

    return database;
}

export function getDatabaseStatus(): string {
    switch (
        mongoose.connection.readyState
    ) {
        case 0:
            return "DISCONNECTED";

        case 1:
            return "CONNECTED";

        case 2:
            return "CONNECTING";

        case 3:
            return "DISCONNECTING";

        default:
            return "UNKNOWN";
    }
}

export function isDatabaseConnected(): boolean {
    return (
        mongoose.connection.readyState === 1
    );
}