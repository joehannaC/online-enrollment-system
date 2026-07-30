import {
    Db,
    MongoClient,
    type MongoClientOptions,
} from "mongodb";

import { env } from "./env.js";

const mongoOptions: MongoClientOptions = {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    retryReads: true,
    retryWrites: true,
};

const mongoClient =
    new MongoClient(
        env.MONGODB_URI,
        mongoOptions,
    );

let database: Db | null = null;
let connected = false;

export interface DatabaseStatus {
    connected: boolean;
    databaseName: string;
    state:
        | "CONNECTED"
        | "DISCONNECTED";
}

export async function connectDatabase(): Promise<Db> {
    if (database && connected) {
        return database;
    }

    await mongoClient.connect();

    database = mongoClient.db(
        env.MONGODB_DATABASE,
    );

    await database.command({
        ping: 1,
    });

    connected = true;

    console.log(
        `[${env.SERVICE_NAME}] MongoDB connection established`,
    );

    return database;
}

export function getDatabase(): Db {
    if (!database || !connected) {
        throw new Error(
            `[${env.SERVICE_NAME}] MongoDB is not connected.`,
        );
    }

    return database;
}

export function isDatabaseConnected(): boolean {
    return connected;
}

export function getDatabaseStatus(): DatabaseStatus {
    return {
        connected,
        databaseName:
            env.MONGODB_DATABASE,
        state: connected
            ? "CONNECTED"
            : "DISCONNECTED",
    };
}

export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        if (!database || !connected) {
            return false;
        }

        await database.command({
            ping: 1,
        });

        return true;
    } catch {
        return false;
    }
}

export async function disconnectDatabase(): Promise<void> {
    if (!connected) {
        return;
    }

    await mongoClient.close();

    database = null;
    connected = false;

    console.log(
        `[${env.SERVICE_NAME}] MongoDB connection closed`,
    );
}