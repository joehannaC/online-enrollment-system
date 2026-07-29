import type { Server as HttpServer } from "node:http";
import type * as grpc from "@grpc/grpc-js";

import { app } from "./app.js";
import {
    connectDatabase,
    disconnectDatabase,
} from "./config/database.js";
import { env } from "./config/env.js";
import {
    startGrpcServer,
    stopGrpcServer,
} from "./grpc/healthGrpcServer.js";

let httpServer: HttpServer | undefined;
let grpcServer: grpc.Server | undefined;
let shuttingDown = false;

async function startService(): Promise<void> {
    await connectDatabase();

    grpcServer = await startGrpcServer();

    httpServer = app.listen(
        env.HTTP_PORT,
        env.HTTP_HOST,
        () => {
            console.log(
                `[${env.SERVICE_NAME}] HTTP listening on ` +
                    `${env.HTTP_HOST}:${env.HTTP_PORT}`,
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
        `[${env.SERVICE_NAME}] Received ${signal}; shutting down`,
    );

    if (httpServer) {
        await new Promise<void>(
            (resolve, reject) => {
                httpServer?.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            },
        );
    }

    if (grpcServer) {
        await stopGrpcServer(grpcServer);
    }

    await disconnectDatabase();

    process.exit(0);
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            `[${env.SERVICE_NAME}] Uncaught exception`,
            error,
        );

        void shutdown(
            "uncaughtException",
        );
    },
);

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            `[${env.SERVICE_NAME}] Unhandled rejection`,
            error,
        );

        void shutdown(
            "unhandledRejection",
        );
    },
);

startService().catch(
    (error: unknown) => {
        console.error(
            `[${env.SERVICE_NAME}] Startup failed`,
            error,
        );

        process.exit(1);
    },
);