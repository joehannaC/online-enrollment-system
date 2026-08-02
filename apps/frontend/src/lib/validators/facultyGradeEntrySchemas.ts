import { z } from "zod";

const optionalScore =
    z.number()
        .finite()
        .min(
            0,
            "Score cannot be below 0.",
        )
        .max(
            100,
            "Score cannot exceed 100.",
        )
        .optional();

export const gradeComponentsSchema =
    z.object({
        activitiesScore:
            optionalScore,

        majorOutput1Score:
            optionalScore,

        majorOutput2Score:
            optionalScore,

        midtermExamScore:
            optionalScore,

        finalExamScore:
            optionalScore,
    });

export const completeGradeComponentsSchema =
    gradeComponentsSchema.superRefine(
        (
            value,
            context,
        ) => {
            for (
                const [
                    key,
                    score,
                ] of Object.entries(
                    value,
                )
            ) {
                if (
                    score ===
                    undefined
                ) {
                    context.addIssue({
                        code:
                            "custom",
                        path: [
                            key,
                        ],
                        message:
                            "This score is required before submission.",
                    });
                }
            }
        },
    );
