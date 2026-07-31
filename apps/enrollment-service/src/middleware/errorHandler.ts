import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    StudentRecordServiceError,
} from "../services/studentRecordService.js";

export function errorHandler(
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    console.error(error);

    if (
        error instanceof
        StudentRecordServiceError
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
                        "enrollment-service",
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
                    "enrollment-service",
            },
        });
}