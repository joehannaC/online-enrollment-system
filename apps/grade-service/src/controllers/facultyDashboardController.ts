import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    FacultyDashboardError,
    getFacultyDashboard,
} from "../services/facultyDashboardService.js";

export async function getFacultyDashboardController(
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
                    code:
                        "AUTHENTICATION_REQUIRED",
                    message:
                        "The authenticated user could not be determined.",
                    service: "grade-service",
                },
            });

            return;
        }

        const dashboard =
            await getFacultyDashboard(
                authenticatedUserId,
            );

        response.status(200).json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        if (
            error instanceof
            FacultyDashboardError
        ) {
            response.status(
                error.statusCode,
            ).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    service: "grade-service",
                },
            });

            return;
        }

        next(error);
    }
}