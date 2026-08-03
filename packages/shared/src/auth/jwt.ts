import jwt, { type JwtPayload } from "jsonwebtoken";
import type { AccessTokenClaims, UserRole } from "./types.js";

function getJwtSecret(): string {
    const value = process.env.JWT_SECRET?.trim() || process.env.JWT_ACCESS_SECRET?.trim();
    if (!value) throw new Error("JWT_SECRET or JWT_ACCESS_SECRET is not configured.");
    return value;
}

function isUserRole(value: unknown): value is UserRole {
    return value === "STUDENT" || value === "FACULTY";
}

export function verifyAccessToken(token: string): AccessTokenClaims {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string") throw new Error("The access token payload is invalid.");

    const subject = typeof decoded.sub === "string"
        ? decoded.sub
        : typeof decoded.userId === "string"
        ? decoded.userId
        : null;

    if (!subject || !isUserRole(decoded.role)) {
        throw new Error("The access token payload is invalid.");
    }

    const expectedIssuer = process.env.JWT_ISSUER?.trim();
    if (expectedIssuer && decoded.iss && decoded.iss !== expectedIssuer) {
        throw new Error("The access token issuer is invalid.");
    }

    const expectedAudience = process.env.JWT_AUDIENCE?.trim();
    if (expectedAudience && decoded.aud) {
        const audiences = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
        if (!audiences.includes(expectedAudience)) {
            throw new Error("The access token audience is invalid.");
        }
    }

    return {
        ...decoded,
        sub: subject,
        userId: subject,
        role: decoded.role,
        username: typeof decoded.username === "string" ? decoded.username : undefined,
        studentId: typeof decoded.studentId === "string" ? decoded.studentId : undefined,
        facultyId: typeof decoded.facultyId === "string" ? decoded.facultyId : undefined,
    };
}
