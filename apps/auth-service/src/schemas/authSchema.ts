import { z } from "zod";

export const loginSchema = z.object({
    usernameOrEmail: z
        .string()
        .trim()
        .min(1, "Username or email is required.")
        .max(254, "Username or email is too long."),

    password: z
        .string()
        .min(1, "Password is required.")
        .max(128, "Password is too long."),
});

export type LoginInput = z.infer<typeof loginSchema>;