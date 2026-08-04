import type {
    Request,
    Response,
} from "express";

import { loginSchema } from "../schemas/authSchema.js";
import { loginUser } from "../services/authService.js";
import { AuthError } from "../utils/AuthError.js";

export async function loginController(
    request: Request,
    response: Response,
): Promise<void> {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
        response.status(400).json({
        success: false,
        error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login information.",
            details: parsedBody.error.flatten().fieldErrors,
        },
        });

        return;
    }

    try {
        const result = await loginUser(parsedBody.data);

        response.status(200).json({
        success: true,
        data: result,
        message: "Login successful.",
        });
    } catch (error) {
        if (error instanceof AuthError) {
        response.status(error.statusCode).json({
            success: false,
            error: {
            code: error.code,
            message: error.message,
            service: "auth-service",
            },
        });

        return;
    }

    console.error("[auth-service] Login error:", error);

    response.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to process the login request.",
            service: "auth-service",
        },
        });
    }
}