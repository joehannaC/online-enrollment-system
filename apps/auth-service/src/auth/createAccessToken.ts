import jwt from "jsonwebtoken";
import type { UserRole } from "@online-enrollment/shared/auth";

export interface CreateAccessTokenInput {
    userId: string;
    username: string;
    role: UserRole;
    studentId?: string;
    facultyId?: string;
}

function getJwtSecret(): string {
    const value = process.env.JWT_SECRET?.trim() || process.env.JWT_ACCESS_SECRET?.trim();
    if (!value) throw new Error("JWT_SECRET or JWT_ACCESS_SECRET is not configured.");
    return value;
}

export function createAccessToken(input: CreateAccessTokenInput): string {
    return jwt.sign(
        {
            userId: input.userId,
            username: input.username,
            role: input.role,
            studentId: input.studentId,
            facultyId: input.facultyId,
        },
        getJwtSecret(),
        {
            algorithm: "HS256",
            subject: input.userId,
            issuer: process.env.JWT_ISSUER?.trim() || "online-enrollment-auth-service",
            audience: process.env.JWT_AUDIENCE?.trim() || "online-enrollment-system",
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "1h",
        },
    );
}
