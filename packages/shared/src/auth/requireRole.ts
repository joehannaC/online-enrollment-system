import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "./types.js";

export function requireRole(...allowedRoles: UserRole[]) {
    return function roleMiddleware(request: Request, response: Response, next: NextFunction): void {
        const authUser = request.authUser;
        if (!authUser) {
            response.status(401).json({ success: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." } });
            return;
        }
        if (!allowedRoles.includes(authUser.role)) {
            response.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "You are not authorized to access this resource." } });
            return;
        }
        next();
    };
}
