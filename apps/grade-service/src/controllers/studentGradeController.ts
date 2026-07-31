import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getDatabase,
} from "../config/database.js";
import {
    getStudentGrades,
} from "../services/studentGradeService.js";
import {
    studentGradeQuerySchema,
} from "../validators/studentGradeQuerySchema.js";

export async function handleGetStudentGrades(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (
            !request.auth?.userId
        ) {
            response.status(401).json({
                success: false,

                error: {
                    code:
                        "UNAUTHENTICATED",

                    message:
                        "Authentication is required.",

                    service:
                        "grade-service",
                },
            });

            return;
        }

        if (
            request.auth.role !==
            "STUDENT"
        ) {
            response.status(403).json({
                success: false,

                error: {
                    code:
                        "STUDENT_ACCESS_REQUIRED",

                    message:
                        "Only students can view student grades.",

                    service:
                        "grade-service",
                },
            });

            return;
        }

        const parsedQuery =
            studentGradeQuerySchema.safeParse(
                request.query,
            );

        if (!parsedQuery.success) {
            response.status(400).json({
                success: false,

                error: {
                    code:
                        "INVALID_GRADE_QUERY",

                    message:
                        "The grade query is invalid.",

                    details:
                        parsedQuery.error.flatten(),

                    service:
                        "grade-service",
                },
            });

            return;
        }

        const result =
            await getStudentGrades(
                getDatabase(),
                request.auth.userId,
                parsedQuery.data,
            );

        response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}