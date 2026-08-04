import cors, {
    type CorsOptions,
} from "cors";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authenticateRequest } from "./middleware/auth.js";
import { proxyRoutes } from "./routes/proxyRoutes.js";

export const app =
    express();

app.disable(
    "x-powered-by",
);

app.use(
    helmet(),
);

const allowedOrigins =
    env.FRONTEND_ORIGINS;

console.log(
    `[${env.SERVICE_NAME}] Allowed CORS origins:`,
    allowedOrigins,
);

const corsOptions: CorsOptions = {
    origin(
        origin,
        callback,
    ) {
        if (!origin) {
            callback(
                null,
                true,
            );

            return;
        }

        if (
            allowedOrigins.includes(
                origin,
            )
        ) {
            callback(
                null,
                true,
            );

            return;
        }

        console.warn(
            `[${env.SERVICE_NAME}] CORS blocked origin: ${origin}`,
        );

        callback(
            new Error(
                `CORS blocked origin: ${origin}`,
            ),
        );
    },

    credentials:
        true,

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
        "Idempotency-Key",
    ],

    exposedHeaders: [
        "Content-Length",
        "Content-Type",
    ],

    optionsSuccessStatus:
        204,

    maxAge:
        600,
};

app.use(
    cors(
        corsOptions,
    ),
);

app.get(
    "/health",
    (
        _request: Request,
        response: Response,
    ) => {
        response
            .status(200)
            .json({
                status:
                    "UP",

                service:
                    env.SERVICE_NAME,

                transport:
                    "HTTP",

                allowedOrigins,

                timestamp:
                    new Date()
                        .toISOString(),
            });
    },
);

app.use("/api/students", authenticateRequest);
app.use("/api/faculty", authenticateRequest);
app.use("/api/grades", authenticateRequest);
app.use("/api/profiles", authenticateRequest);

app.use(
    proxyRoutes,
);

app.use(
    (
        _request: Request,
        response: Response,
    ) => {
        response
            .status(404)
            .json({
                success:
                    false,

                error: {
                    code:
                        "GATEWAY_ROUTE_NOT_FOUND",

                    message:
                        "Route not found.",

                    service:
                        env.SERVICE_NAME,
                },
            });
    },
);

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

        const isCorsError =
            error instanceof Error &&
            error.message.startsWith(
                "CORS blocked origin:",
            );

        response
            .status(
                isCorsError
                    ? 403
                    : 500,
            )
            .json({
                success:
                    false,

                error: {
                    code:
                        isCorsError
                            ? "CORS_ORIGIN_BLOCKED"
                            : "GATEWAY_INTERNAL_ERROR",

                    message:
                        isCorsError
                            ? error.message
                            : "The API gateway encountered an error.",

                    service:
                        env.SERVICE_NAME,
                },
            });
    },
);