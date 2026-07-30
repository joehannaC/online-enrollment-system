import type {
    ApiErrorResponse,
    ApiResponse,
    FacultyDashboardResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

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

    let response: Response;

    try {
        response = await fetch(
            "/api/faculty/dashboard",
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
    } catch (error) {
        if (
            error instanceof DOMException &&
            error.name === "AbortError"
        ) {
            throw error;
        }

        throw new FacultyApiError(
            "GRADE_SERVICE_UNAVAILABLE",
            "The Grade Service is unavailable.",
            503,
            "grade-service",
        );
    }

    let body:
        | ApiResponse<FacultyDashboardResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<FacultyDashboardResponse>
                | ApiErrorResponse;
    } catch {
        throw new FacultyApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Grade Service returned an invalid response.",
            response.status || 502,
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