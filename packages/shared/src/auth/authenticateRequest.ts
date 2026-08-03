import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";

export function authenticateRequest(request: Request, response: Response, next: NextFunction): void {
    const authorization = request.header("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
        response.status(401).json({ success: false, error: { code: "MISSING_ACCESS_TOKEN", message: "Authentication is required." } });
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
        response.status(401).json({ success: false, error: { code: "MISSING_ACCESS_TOKEN", message: "Authentication is required." } });
        return;
    }

    try {
        request.authUser = verifyAccessToken(token);
        next();
    } catch (error) {
        console.error("[JWT verification failed]", error);
        response.status(401).json({
            success: false,
            error: {
                code: "INVALID_ACCESS_TOKEN",
                message: error instanceof Error ? error.message : "The access token is invalid or expired.",
            },
        });
    }
}
