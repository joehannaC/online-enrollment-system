import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    FacultyGradeEntryError,
    getGradeEntryPage,
    saveGradeDraft,
    submitGrades,
} from "../services/facultyGradeEntryService.js";
import {
    saveGradeDraftSchema,
    submitGradesSchema,
} from "../validators/facultyGradeEntrySchemas.js";

function sendValidationError(
    response: Response,
    issues: Array<{
        path: PropertyKey[];
        message: string;
    }>,
): void {
    response.status(400).json({
        success: false,
        error: {
            code:
                "VALIDATION_ERROR",
            message:
                "The grade request contains invalid values.",
            service:
                "grade-service",
            details:
                issues.map(
                    (issue) => ({
                        field:
                            issue.path.join(
                                ".",
                            ),
                        message:
                            issue.message,
                    }),
                ),
        },
    });
}

export async function getFacultyGradeEntryController(
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
                        "grade-service",
                },
            });
            return;
        }

        const sectionId =
            typeof request.query
                .sectionId ===
            "string"
                ? request.query
                      .sectionId
                : undefined;

        const result =
            await getGradeEntryPage(
                userId,
                sectionId,
            );

        response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (
            error instanceof
            FacultyGradeEntryError
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

export async function saveFacultyGradeDraftController(
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
                        "grade-service",
                },
            });
            return;
        }

        const parsed =
            saveGradeDraftSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            sendValidationError(
                response,
                parsed.error.issues,
            );
            return;
        }

        const result =
            await saveGradeDraft(
                userId,
                parsed.data,
            );

        response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (
            error instanceof
            FacultyGradeEntryError
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

export async function submitFacultyGradesController(
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
                        "grade-service",
                },
            });
            return;
        }

        const parsed =
            submitGradesSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            sendValidationError(
                response,
                parsed.error.issues,
            );
            return;
        }

        const result =
            await submitGrades(
                userId,
                parsed.data.sectionId,
            );

        response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (
            error instanceof
            FacultyGradeEntryError
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
