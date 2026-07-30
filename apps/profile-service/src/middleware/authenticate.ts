import type {
    NextFunction,
    Request,
    Response,
} from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

interface AccessTokenPayload {
    sub?: string;
    userId?: string;
    role?:
        | "STUDENT"
        | "FACULTY";
    email?: string;
}

export function authenticate(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const authorizationHeader =
        request.headers.authorization;

    if (
        !authorizationHeader ||
        !authorizationHeader.startsWith(
            "Bearer ",
        )
    ) {
        response.status(401).json({
            success: false,
            error: {
                code:
                    "AUTH_TOKEN_MISSING",
                message:
                    "An access token is required.",
                service:
                    env.SERVICE_NAME,
            },
        });

        return;
    }

    const token =
        authorizationHeader
            .slice(
                "Bearer ".length,
            )
            .trim();

    if (!token) {
        response.status(401).json({
            success: false,
            error: {
                code:
                    "AUTH_TOKEN_MISSING",
                message:
                    "An access token is required.",
                service:
                    env.SERVICE_NAME,
            },
        });

        return;
    }

    try {
        const payload =
            jwt.verify(
                token,
                env.JWT_SECRET,
            ) as AccessTokenPayload;

        const userId =
            payload.sub ??
            payload.userId;

        if (
            !userId ||
            !payload.role
        ) {
            response.status(401).json({
                success: false,
                error: {
                    code:
                        "AUTH_TOKEN_INVALID",
                    message:
                        "The access token payload is invalid.",
                    service:
                        env.SERVICE_NAME,
                },
            });

            return;
        }

        request.auth = {
            userId,
            role:
                payload.role,
            email:
                payload.email,
        };

        next();
    } catch (error) {
        const isExpired =
            error instanceof
            jwt.TokenExpiredError;

        response.status(401).json({
            success: false,
            error: {
                code: isExpired
                    ? "AUTH_TOKEN_EXPIRED"
                    : "AUTH_TOKEN_INVALID",

                message: isExpired
                    ? "Your login session has expired."
                    : "The access token is invalid.",

                service:
                    env.SERVICE_NAME,
            },
        });
    }
}