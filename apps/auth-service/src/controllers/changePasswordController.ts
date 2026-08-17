import type {
    NextFunction,
    Request,
    Response,
} from "express";
import {
    ZodError,
} from "zod";

import { changePasswordSchema } from "../schemas/changePasswordSchema.js";
import {
    changePassword,
    ChangePasswordError,
} from "../services/changePasswordService.js";

export async function changePasswordController(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId =
            request.auth?.userId;

        if (!userId) {
            response.status(401).json({
                success: false,
                error: {
                    code:
                        "AUTHENTICATION_REQUIRED",
                    message:
                        "Authentication is required.",
                    service:
                        "auth-service",
                },
            });

            return;
        }

        const input = changePasswordSchema.parse(request.body,);

        await changePassword(userId, input,);

        response.status(200).json({
            success: true,
            data: {
                message:
                    "Password changed successfully.",
            },
        });
    } catch (error) {
        if (error instanceof ZodError) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "VALIDATION_ERROR",
                    message:
                        "The password information is invalid.",
                    service:
                        "auth-service",
                    details:
                        error.flatten()
                            .fieldErrors,
                },
            });

            return;
        }

        if (error instanceof ChangePasswordError) {
            response.status(
                error.statusCode,
            ).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    service:
                        "auth-service",
                },
            });

            return;
        }

        next(error);
    }
}