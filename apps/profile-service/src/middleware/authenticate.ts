import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    verifyAccessToken,
} from "@online-enrollment/shared/auth";

import {
    env,
} from "../config/env.js";

export function authenticate(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const authorization =
        request.header(
            "authorization",
        );

    if (
        !authorization ||
        !authorization.startsWith(
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
        authorization
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
            verifyAccessToken(
                token,
            );

        request.auth = {
            userId:
                payload.userId,

            role:
                payload.role,

            email:
                typeof payload.email ===
                "string"
                    ? payload.email
                    : undefined,

            studentId:
                payload.studentId,

            facultyId:
                payload.facultyId,
        };

        request.authUser =
            payload;

        next();
    } catch (error) {
        console.error(
            `[${env.SERVICE_NAME}] JWT verification failed:`,
            error,
        );

        response.status(401).json({
            success: false,
            error: {
                code:
                    "AUTH_TOKEN_INVALID",

                message:
                    error instanceof Error
                        ? error.message
                        : "The access token is invalid or expired.",

                service:
                    env.SERVICE_NAME,
            },
        });
    }
}