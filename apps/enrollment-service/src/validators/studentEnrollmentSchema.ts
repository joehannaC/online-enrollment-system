import { z } from "zod";

export const enrollmentListQuerySchema =
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

export const updateDraftSchema =
    z.object({
        sectionIds: z
            .array(
                z.string()
                    .trim()
                    .min(1),
            )
            .max(30),

        expectedVersion: z
            .number()
            .int()
            .min(0),
    });

export const submitEnrollmentSchema =
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

export type EnrollmentListQuery =
    z.infer<
        typeof enrollmentListQuerySchema
    >;

export type UpdateDraftInput =
    z.infer<
        typeof updateDraftSchema
    >;

export type SubmitEnrollmentInput =
    z.infer<
        typeof submitEnrollmentSchema
    >;