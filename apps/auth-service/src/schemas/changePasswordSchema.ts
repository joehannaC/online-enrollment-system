import { z } from "zod";

export const passwordSchema = z
    .string()
    .min(
        8,
        "Password must be at least 8 characters long.",
    )
    .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter.",
    )
    .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter.",
    )
    .regex(
        /[0-9]/,
        "Password must contain at least one number.",
    )
    .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character.",
    );

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(
                1,
                "Current password is required.",
            ),

        newPassword: passwordSchema,

        confirmPassword: z
            .string()
            .min(
                1,
                "Please confirm your new password.",
            ),
    })
    .refine(
        (values) =>
            values.newPassword ===
            values.confirmPassword,
        {
            path: ["confirmPassword"],
            message:
                "The passwords do not match.",
        },
    )
    .refine(
        (values) =>
            values.currentPassword !==
            values.newPassword,
        {
            path: ["newPassword"],
            message:
                "The new password must be different from the current password.",
        },
    );

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;