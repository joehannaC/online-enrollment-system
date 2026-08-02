import { z } from "zod";

const optionalScoreSchema =
    z.number()
        .finite()
        .min(0)
        .max(100)
        .optional();

export const gradeComponentsSchema =
    z.object({
        activitiesScore:
            optionalScoreSchema,

        majorOutput1Score:
            optionalScoreSchema,

        majorOutput2Score:
            optionalScoreSchema,

        midtermExamScore:
            optionalScoreSchema,

        finalExamScore:
            optionalScoreSchema,
    })
    .strict();

export const saveGradeDraftSchema =
    z.object({
        sectionId:
            z.string().min(1),

        grades:
            z.array(
                z.object({
                    gradeId:
                        z.string()
                            .min(1)
                            .optional(),

                    studentId:
                        z.string().min(1),

                    expectedVersion:
                        z.number()
                            .int()
                            .min(0),

                    components:
                        gradeComponentsSchema,
                }).strict(),
            )
            .min(1),
    })
    .strict();

export const submitGradesSchema =
    z.object({
        sectionId:
            z.string().min(1),
    })
    .strict();
