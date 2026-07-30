import type {
    ApiErrorResponse,
    ApiResponse,
    ProfileResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

export class ProfileApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
    ) {
        super(message);

        this.name = "ProfileApiError";
    }
}

export async function getMyProfile(
    signal?: AbortSignal,
): Promise<ProfileResponse> {
    const token =
        getAccessToken();

    if (!token) {
        throw new ProfileApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    let response: Response;

    try {
        response = await fetch(
            "/api/profiles/me",
            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                signal,
                cache: "no-store",
            },
        );
    } catch (error) {
        if (
            error instanceof DOMException &&
            error.name === "AbortError"
        ) {
            throw error;
        }

        throw new ProfileApiError(
            "PROFILE_SERVICE_UNAVAILABLE",
            "The Profile Service is unavailable.",
            503,
            "profile-service",
        );
    }

    let body:
        | ApiResponse<ProfileResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<ProfileResponse>
                | ApiErrorResponse;
    } catch {
        throw new ProfileApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Profile Service returned an invalid response.",
            response.status || 502,
            "profile-service",
        );
    }

    if (
        !response.ok ||
        body.success === false
    ) {
        const errorBody =
            body as ApiErrorResponse;

        throw new ProfileApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
        );
    }

    return body.data;
}