import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { env } from "../config/env.js";

export function notFoundHandler(
    request: Request,
    response: Response,
): void {
    response.status(404).json({
        success: false,
        error: {
            code:
                "ROUTE_NOT_FOUND",
            message:
                `Route ${request.method} ${request.originalUrl} was not found.`,
            service:
                env.SERVICE_NAME,
        },
    });
}

export function errorHandler(
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
): void {
    console.error(
        `[${env.SERVICE_NAME}] Unexpected error`,
        error,
    );

    response.status(500).json({
        success: false,
        error: {
            code:
                "INTERNAL_SERVER_ERROR",
            message:
                "An unexpected server error occurred.",
            service:
                env.SERVICE_NAME,
        },
    });
}