import {
    Db,
    MongoClient,
    type MongoClientOptions,
} from "mongodb";

import { env } from "./env.js";

const mongoClientOptions: MongoClientOptions = {
    maxPoolSize: 50,
    minPoolSize: 5,
    maxIdleTimeMS: 30_000,

    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: 30_000,

    retryReads: true,
    retryWrites: true,
};

const mongoClient = new MongoClient(
    env.MONGODB_URI,
    mongoClientOptions,
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
        `[${env.SERVICE_NAME}] Connected to MongoDB database: ${env.MONGODB_DATABASE}`,
    );

    return database;
}

export function getDatabase(): Db {
    if (!database || !connected) {
        throw new Error(
            "MongoDB has not been initialized. Call connectDatabase() first.",
        );
    }

    return database;
}

export function getMongoClient(): MongoClient {
    if (!mongoClient) {
        throw new Error(
            "MongoDB client has not been initialized.",
        );
    }

    return mongoClient;
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
        if (!database) {
            connected = false;
            return false;
        }

        await database.command({
            ping: 1,
        });

        connected = true;

        return true;
    } catch {
        connected = false;

        return false;
    }
}

export async function closeDatabase(): Promise<void> {
    if (!connected && !database) {
        return;
    }

    await mongoClient.close();

    database = null;
    connected = false;

    console.log(
        `[${env.SERVICE_NAME}] Disconnected from MongoDB.`,
    );
}

export async function disconnectDatabase(): Promise<void> {
    await closeDatabase();
}