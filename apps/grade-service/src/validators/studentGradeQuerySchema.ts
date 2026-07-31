import { z } from "zod";

const studentGradeStatuses = [
    "PASSED",
    "FAILED",
    "CREDITED",
] as const;

export const studentGradeQuerySchema =
    z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional()
            .default(""),

        academicYear: z
            .string()
            .trim()
            .max(20)
            .optional(),

        termNumber: z.coerce
            .number()
            .int()
            .min(1)
            .max(3)
            .optional(),

        status: z
            .enum(
                studentGradeStatuses,
            )
            .optional(),

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

export type StudentGradeQuery =
    z.infer<
        typeof studentGradeQuerySchema
    >;