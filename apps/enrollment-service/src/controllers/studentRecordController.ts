import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getDatabase,
} from "../config/database.js";
import {
    getStudentRecords,
} from "../services/studentRecordService.js";
import {
    studentRecordQuerySchema,
} from "../validators/studentRecordQuerySchema.js";

export async function handleGetStudentRecords(
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
                        "enrollment-service",
                },
            });

            return;
        }

        if (request.auth.role !== "STUDENT") {
            response.status(403).json({
                success: false,
                error: {
                    code:
                        "STUDENT_ACCESS_REQUIRED",
                    message:
                        "Only students can view student records.",
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        const queryResult =
            studentRecordQuerySchema.safeParse(
                request.query,
            );

        if (!queryResult.success) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_RECORD_QUERY",
                    message:
                        "The records query is invalid.",
                    details:
                        queryResult.error.flatten(),
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        const records =
            await getStudentRecords(
                getDatabase(),
                request.auth.userId,
                queryResult.data,
            );

        response.status(200).json({
            success: true,
            data: records,
        });
    } catch (error) {
        next(error);
    }
}