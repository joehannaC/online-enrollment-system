import type {
    ApiErrorResponse,
    ApiResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

const authServiceUrl =
    process.env
        .NEXT_PUBLIC_AUTH_SERVICE_URL ??
    "http://localhost:4100";

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
    const token = getAccessToken();

    if (!token) {
        throw new ChangePasswordApiError(
            "AUTH_TOKEN_MISSING",
            "Your session could not be found.",
            401,
        );
    }

    const response = await fetch(
        `${authServiceUrl}/api/auth/change-password`,
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

            body: JSON.stringify(input),
        },
    );

    const body = (await response.json()) as
        | ApiResponse<ChangePasswordResponse>
        | ApiErrorResponse;

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