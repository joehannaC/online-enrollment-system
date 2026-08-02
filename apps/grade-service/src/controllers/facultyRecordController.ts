import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    FacultyRecordError,
    getFacultyRecords,
} from "../services/facultyRecordService.js";

export async function getFacultyRecordsController(
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
                    service:
                        "grade-service",
                },
            });

            return;
        }

        const records =
            await getFacultyRecords(
                authenticatedUserId,
            );

        response.status(200).json({
            success: true,
            data: records,
        });
    } catch (error) {
        if (
            error instanceof
            FacultyRecordError
        ) {
            response.status(
                error.statusCode,
            ).json({
                success: false,
                error: {
                    code: error.code,
                    message:
                        error.message,
                    service:
                        "grade-service",
                },
            });

            return;
        }

        next(error);
    }
}
