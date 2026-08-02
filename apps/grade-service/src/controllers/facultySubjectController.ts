import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    FacultySubjectError,
    getFacultySubjects,
} from "../services/facultySubjectService.js";

export async function getFacultySubjectsController(
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

        const subjects =
            await getFacultySubjects(
                authenticatedUserId,
            );

        response.status(200).json({
            success: true,
            data: subjects,
        });
    } catch (error) {
        if (
            error instanceof
            FacultySubjectError
        ) {
            response.status(
                error.statusCode,
            ).json({
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

        next(error);
    }
}
