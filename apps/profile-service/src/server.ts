import type {
    Server as HttpServer,
} from "node:http";

import { app } from "./app.js";
import {
    connectDatabase,
    disconnectDatabase,
} from "./config/database.js";
import { env } from "./config/env.js";

let httpServer:
    | HttpServer
    | undefined;

let shuttingDown = false;

async function startServer(): Promise<void> {
    await connectDatabase();

    httpServer = app.listen(
        env.HTTP_PORT,
        env.HTTP_HOST,
        () => {
            console.log(
                `[${env.SERVICE_NAME}] HTTP server listening on ${env.HTTP_HOST}:${env.HTTP_PORT}`,
            );
        },
    );
}

async function shutdown(
    signal: string,
): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(
        `[${env.SERVICE_NAME}] Received ${signal}. Shutting down...`,
    );

    if (httpServer) {
        await new Promise<void>(
            (
                resolve,
                reject,
            ) => {
                httpServer?.close(
                    (error) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    },
                );
            },
        );
    }

    await disconnectDatabase();

    process.exit(0);
}

process.on(
    "SIGINT",
    () => {
        void shutdown(
            "SIGINT",
        );
    },
);

process.on(
    "SIGTERM",
    () => {
        void shutdown(
            "SIGTERM",
        );
    },
);

startServer().catch(
    async (error: unknown) => {
        console.error(
            `[${env.SERVICE_NAME}] Failed to start`,
            error,
        );

        await disconnectDatabase()
            .catch(() => undefined);

        process.exit(1);
    },
);