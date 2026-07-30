import type {
    NextFunction,
    Request,
    Response,
} from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

interface JwtPayload {
    sub?: string;
    userId?: string;
    role?: "STUDENT" | "FACULTY";
    email?: string;
}

export function authenticate(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const authorization =
        request.headers.authorization;

    if (
        !authorization ||
        !authorization.startsWith("Bearer ")
    ) {
        response.status(401).json({
            success: false,
            error: {
                code: "AUTH_TOKEN_MISSING",
                message:
                    "An access token is required.",
                service: "grade-service",
            },
        });

        return;
    }

    const token = authorization.slice(
        "Bearer ".length,
    );

    try {
        const payload = jwt.verify(
            token,
            env.JWT_SECRET,
        ) as JwtPayload;

        const userId =
            payload.sub ?? payload.userId;

        if (!userId || !payload.role) {
            response.status(401).json({
                success: false,
                error: {
                    code: "AUTH_TOKEN_INVALID",
                    message:
                        "The access token payload is invalid.",
                    service: "grade-service",
                },
            });

            return;
        }

        request.auth = {
            userId,
            role: payload.role,
            email: payload.email,
        };

        next();
    } catch {
        response.status(401).json({
            success: false,
            error: {
                code: "AUTH_TOKEN_INVALID",
                message:
                    "The access token is invalid or expired.",
                service: "grade-service",
            },
        });
    }
}

export function requireFaculty(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    if (request.auth?.role !== "FACULTY") {
        response.status(403).json({
            success: false,
            error: {
                code: "FACULTY_ACCESS_REQUIRED",
                message:
                    "This resource is available only to faculty members.",
                service: "grade-service",
            },
        });

        return;
    }

    next();
}