import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getStudentProfile,
    StudentProfileError,
} from "../services/studentProfileService.js";

export async function getStudentProfileController(
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
                        "enrollment-service",
                },
            });

            return;
        }

        const profile =
            await getStudentProfile(
                userId,
            );

        response.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        if (
            error instanceof
            StudentProfileError
        ) {
            response.status(
                error.statusCode,
            ).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        next(error);
    }
}