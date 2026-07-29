import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getStudentDashboard,
    StudentDashboardError,
} from "../services/studentDashboardService.js";

export async function getStudentDashboardController(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const authenticatedUserId =
            request.auth?.userId;

        if (!authenticatedUserId) {
            response.status(401).json({
                success: false,
                error: {
                    code: "AUTHENTICATION_REQUIRED",
                    message:
                        "The authenticated user could not be determined.",
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        const dashboard =
            await getStudentDashboard(
                authenticatedUserId,
            );

        response.status(200).json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        if (
            error instanceof
            StudentDashboardError
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