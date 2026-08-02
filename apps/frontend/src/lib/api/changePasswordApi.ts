import { buildApiUrl } from "@/lib/api/apiBase";
import type {
    ApiErrorResponse,
    ApiResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

export class ChangePasswordApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly details?: Record<
            string,
            unknown
        >,
    ) {
        super(message);

        this.name =
            "ChangePasswordApiError";
    }
}

export async function changePassword(
    input: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
    const token =
        getAccessToken();

    if (!token) {
        throw new ChangePasswordApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
        );
    }

    let response: Response;

    try {
        response = await fetch(
            buildApiUrl("/api/auth/change-password"),
            {
                method: "PATCH",

                headers: {
                    Accept:
                        "application/json",

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                body: JSON.stringify(
                    input,
                ),

                cache: "no-store",
            },
        );
    } catch {
        throw new ChangePasswordApiError(
            "AUTH_SERVICE_UNAVAILABLE",
            "The Authentication Service is unavailable.",
            503,
        );
    }

    let body:
        | ApiResponse<ChangePasswordResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<ChangePasswordResponse>
                | ApiErrorResponse;
    } catch {
        throw new ChangePasswordApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Authentication Service returned an invalid response.",
            response.status || 502,
        );
    }

    if (
        !response.ok ||
        body.success === false
    ) {
        const errorBody =
            body as ApiErrorResponse;

        throw new ChangePasswordApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.details,
        );
    }

    return body.data;
}