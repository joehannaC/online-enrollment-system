import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.HTTP_PORT, env.HTTP_HOST, () => {
    console.log(`[${env.SERVICE_NAME}] HTTP listening on ${env.HTTP_HOST}:${env.HTTP_PORT}`);
});

function shutdown(signal: string): void {
    console.log(`[${env.SERVICE_NAME}] Received ${signal}. Shutting down.`);
    server.close((error) => {
        if (error) {
            console.error(`[${env.SERVICE_NAME}] Shutdown failed`, error);
            process.exit(1);
        }
        process.exit(0);
    });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
