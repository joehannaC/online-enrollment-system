import jwt, {
    type SignOptions,
    type VerifyErrors,
} from "jsonwebtoken";

import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/auth.types.js";

export function generateAccessToken(
    payload: AuthTokenPayload,
): string {
    const options: SignOptions = {
        expiresIn:
        env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
        issuer: "online-enrollment-auth-service",
        audience: "online-enrollment-system",
    };

    return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(
    token: string,
): AuthTokenPayload {
    return jwt.verify(token, env.JWT_SECRET, {
        issuer: "online-enrollment-auth-service",
        audience: "online-enrollment-system",
    }) as AuthTokenPayload;
}

export function isJwtError(
    error: unknown,
): error is VerifyErrors {
    return error instanceof Error;
}