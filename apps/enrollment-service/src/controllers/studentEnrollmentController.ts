import type {
    NextFunction,
    Request,
    Response,
} from "express";
import { z } from "zod";

import {
    addDraftItem,
    getStudentEnrollment,
    removeDraftItem,
    submitEnrollment,
} from "../services/studentEnrollmentService.js";

const enrollmentQuerySchema =
    z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional()
            .default(""),

        availability: z
            .enum([
                "ALL",
                "OPEN",
                "FULL",
            ])
            .optional()
            .default("ALL"),

        page: z.coerce
            .number()
            .int()
            .min(1)
            .optional()
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .default(10),
    });

const addDraftItemSchema =
    z.object({
        sectionId: z
            .string()
            .trim()
            .min(1),

        expectedVersion: z
            .number()
            .int()
            .min(0),
    });

const removeDraftItemSchema =
    z.object({
        expectedVersion: z
            .number()
            .int()
            .min(0),
    });

const submitEnrollmentSchema =
    z.object({
        expectedVersion: z
            .number()
            .int()
            .min(0),

        idempotencyKey: z
            .string()
            .trim()
            .min(8)
            .max(128),
    });

function requireStudent(
    request: Request,
    response: Response,
): request is Request & {
    auth: {
        userId: string;
        role: "STUDENT";
    };
} {
    if (!request.auth?.userId) {
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

        return false;
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
                    "Only students can access enrollment.",
                service:
                    "enrollment-service",
            },
        });

        return false;
    }

    return true;
}

export async function handleGetStudentEnrollment(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (
            !requireStudent(
                request,
                response,
            )
        ) {
            return;
        }

        const parsed =
            enrollmentQuerySchema.safeParse(
                request.query,
            );

        if (!parsed.success) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_ENROLLMENT_QUERY",
                    message:
                        "The enrollment query is invalid.",
                    details:
                        parsed.error.flatten(),
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        const result =
            await getStudentEnrollment(
                request.auth.userId,
                parsed.data,
            );

        response.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function handleAddDraftItem(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (
            !requireStudent(
                request,
                response,
            )
        ) {
            return;
        }

        const parsed =
            addDraftItemSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_DRAFT_ITEM",
                    message:
                        "The selected section is invalid.",
                    details:
                        parsed.error.flatten(),
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        await addDraftItem(
            request.auth.userId,
            parsed.data,
        );

        response.status(200).json({
            success: true,
            data: {
                message:
                    "Course added to the enrollment draft.",
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function handleRemoveDraftItem(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (
            !requireStudent(
                request,
                response,
            )
        ) {
            return;
        }

        const itemId =
            request.params.itemId;

        if (
            typeof itemId !==
            "string" ||
            itemId.trim().length ===
            0
        ) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_ENROLLMENT_ITEM_ID",
                    message:
                        "The enrollment item ID is invalid.",
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        const parsed =
            removeDraftItemSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_REMOVE_REQUEST",
                    message:
                        "The remove request is invalid.",
                    details:
                        parsed.error.flatten(),
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        await removeDraftItem(
            request.auth.userId,
            itemId,
            parsed.data.expectedVersion,
        );

        response.status(200).json({
            success: true,
            data: {
                message:
                    "Course removed from the enrollment draft.",
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function handleSubmitEnrollment(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (
            !requireStudent(
                request,
                response,
            )
        ) {
            return;
        }

        const parsed =
            submitEnrollmentSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            response.status(400).json({
                success: false,
                error: {
                    code:
                        "INVALID_ENROLLMENT_SUBMISSION",
                    message:
                        "The enrollment submission is invalid.",
                    details:
                        parsed.error.flatten(),
                    service:
                        "enrollment-service",
                },
            });

            return;
        }

        await submitEnrollment(
            request.auth.userId,
            parsed.data,
        );

        response.status(200).json({
            success: true,
            data: {
                message:
                    "Enrollment submitted successfully.",
            },
        });
    } catch (error) {
        next(error);
    }
}