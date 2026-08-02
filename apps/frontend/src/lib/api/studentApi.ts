import { buildApiUrl } from "@/lib/api/apiBase";
import type {
    ApiErrorResponse,
    ApiResponse,
    StudentDashboardResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

export class StudentApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
    ) {
        super(message);

        this.name = "StudentApiError";
    }
}

export async function getStudentDashboard(
    signal?: AbortSignal,
): Promise<StudentDashboardResponse> {
    const accessToken =
        getAccessToken();

    if (!accessToken) {
        throw new StudentApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    let response: Response;

    try {
        response = await fetch(
            buildApiUrl("/api/students/dashboard"),
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

        throw new StudentApiError(
            "ENROLLMENT_SERVICE_UNAVAILABLE",
            "The Enrollment Service is unavailable.",
            503,
            "enrollment-service",
        );
    }

    let body:
        | ApiResponse<StudentDashboardResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<StudentDashboardResponse>
                | ApiErrorResponse;
    } catch {
        throw new StudentApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Enrollment Service returned an invalid response.",
            response.status || 502,
            "enrollment-service",
        );
    }

    if (
        !response.ok ||
        body.success === false
    ) {
        const errorBody =
            body as ApiErrorResponse;

        throw new StudentApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
        );
    }

    return body.data;
}