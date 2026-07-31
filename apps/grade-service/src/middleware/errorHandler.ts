import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    StudentGradeServiceError,
} from "../services/studentGradeService.js";

export function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    console.error(
        "[grade-service]",
        error,
    );

    if (
        response.headersSent
    ) {
        next(error);

        return;
    }

    if (
        error instanceof
        StudentGradeServiceError
    ) {
        response
            .status(error.status)
            .json({
                success: false,

                error: {
                    code:
                        error.code,

                    message:
                        error.message,

                    service:
                        "grade-service",
                },
            });

        return;
    }

    response
        .status(500)
        .json({
            success: false,

            error: {
                code:
                    "INTERNAL_SERVER_ERROR",

                message:
                    "An unexpected error occurred.",

                service:
                    "grade-service",
            },
        });
}