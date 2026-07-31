import { z } from "zod";

const recordStatuses = [
    "IN_PROGRESS",
    "COMPLETED",
    "CANNOT_YET_BE_ENLISTED",
    "REGISTERED",
    "CAN_BE_ENLISTED",
    "CREDITED",
] as const;

export const studentRecordQuerySchema =
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
            .enum(recordStatuses)
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

export type StudentRecordQuery =
    z.infer<
        typeof studentRecordQuerySchema
    >;