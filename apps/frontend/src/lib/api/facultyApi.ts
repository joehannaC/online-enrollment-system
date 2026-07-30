import type {
    ApiErrorResponse,
    ApiResponse,
    FacultyDashboardResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

const gradeServiceUrl =
    process.env
        .NEXT_PUBLIC_GRADE_SERVICE_URL ??
    "http://localhost:4102";

export class FacultyApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
    ) {
        super(message);
        this.name = "FacultyApiError";
    }
}

export async function getFacultyDashboard(
    signal?: AbortSignal,
): Promise<FacultyDashboardResponse> {
    const accessToken =
        getAccessToken();

    if (!accessToken) {
        throw new FacultyApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    const response = await fetch(
        `${gradeServiceUrl}/api/faculty/dashboard`,
        {
            method: "GET",

            headers: {
                Accept:
                    "application/json",

                Authorization:
                    `Bearer ${accessToken}`,
            },

            signal,
            cache: "no-store",
        },
    );

    let body:
        | ApiResponse<FacultyDashboardResponse>
        | ApiErrorResponse;

    try {
        body = (await response.json()) as
            | ApiResponse<FacultyDashboardResponse>
            | ApiErrorResponse;
    } catch {
        throw new FacultyApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Grade Service returned an invalid response.",
            response.status,
            "grade-service",
        );
    }

    if (
        !response.ok ||
        body.success === false
    ) {
        const errorBody =
            body as ApiErrorResponse;

        throw new FacultyApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
        );
    }

    return body.data;
}