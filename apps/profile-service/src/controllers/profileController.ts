import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    getProfileByUserId,
    ProfileServiceError,
} from "../services/profileService.js";

export async function getMyProfileController(
    request: Request,
    response: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const auth =
            request.auth;

        if (!auth) {
            response.status(401).json({
                success: false,
                error: {
                    code:
                        "AUTHENTICATION_REQUIRED",
                    message:
                        "Authentication is required.",
                    service:
                        "profile-service",
                },
            });

            return;
        }

        const profile =
            await getProfileByUserId(
                auth.userId,
                auth.role,
            );

        response.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        if (
            error instanceof
            ProfileServiceError
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
                        "profile-service",
                },
            });

            return;
        }

        next(error);
    }
}