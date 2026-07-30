import cors from "cors";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import helmet from "helmet";

import {
    getDatabaseStatus,
    isDatabaseConnected,
} from "./config/database.js";
import { env } from "./config/env.js";
import facultyRouter from "./routes/facultyRoutes.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
    cors({
        origin: env.FRONTEND_URL,
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    }),
);

app.use(
    express.json({
        limit: "1mb",
    }),
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    }),
);

app.get(
    "/health",
    (
        _request: Request,
        response: Response,
    ) => {
        const databaseConnected =
            isDatabaseConnected();

        response
            .status(
                databaseConnected
                    ? 200
                    : 503,
            )
            .json({
                status: databaseConnected
                    ? "UP"
                    : "DEGRADED",
                service: env.SERVICE_NAME,
                transport: "HTTP",
                databaseStatus:
                    getDatabaseStatus(),
                host: env.HTTP_HOST,
                port: env.HTTP_PORT,
                timestamp:
                    new Date().toISOString(),
            });
    },
);

/*
 * Application routes must be registered
 * before the 404 middleware.
 */
app.use(
    "/api/faculty",
    facultyRouter,
);

/*
 * This middleware runs only when no
 * previously registered route matched.
 */
app.use(
    (
        request: Request,
        response: Response,
        _next: NextFunction,
    ) => {
        response.status(404).json({
            error: "Route not found",
            method: request.method,
            path: request.originalUrl,
            service: env.SERVICE_NAME,
        });
    },
);

/*
 * Express error-handling middleware must
 * contain all four parameters.
 */
app.use(
    (
        error: unknown,
        _request: Request,
        response: Response,
        _next: NextFunction,
    ) => {
        console.error(
            `[${env.SERVICE_NAME}]`,
            error,
        );

        if (response.headersSent) {
            return;
        }

        response.status(500).json({
            error: "Internal server error",
            service: env.SERVICE_NAME,
        });
    },
);

export default app;