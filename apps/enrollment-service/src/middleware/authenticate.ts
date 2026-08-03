import type {
    NextFunction,
    Request,
    Response,
} from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    sub?: string;
    userId?: string;
    role?: "STUDENT" | "FACULTY";
    email?: string;
}

const jwtSecret = process.env.JWT_ACCESS_SECRET;

if (!jwtSecret) {
    throw new Error(
        "JWT_ACCESS_SECRET is missing from enrollment-service environment.",
    );
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
        !authorizationHeader.startsWith("Bearer ")
    ) {
        response.status(401).json({
            success: false,
            error: {
                code: "AUTH_TOKEN_MISSING",
                message:
                    "An access token is required.",
                service: "enrollment-service",
            },
        });

        return;
    }

    const token = authorizationHeader.slice(
        "Bearer ".length,
    );

    try {
        const payload = jwt.verify(
            token,
            jwtSecret,
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
                    service: "enrollment-service",
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
                service: "enrollment-service",
            },
        });
    }
}

export function requireStudent(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    if (request.auth?.role !== "STUDENT") {
        response.status(403).json({
            success: false,
            error: {
                code: "STUDENT_ACCESS_REQUIRED",
                message:
                    "This resource is available only to students.",
                service: "enrollment-service",
            },
        });

        return;
    }

    next();
}