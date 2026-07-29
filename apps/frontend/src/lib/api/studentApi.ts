import type {
    ApiErrorResponse,
    ApiResponse,
    StudentDashboardResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

const enrollmentServiceUrl =
    process.env
        .NEXT_PUBLIC_ENROLLMENT_SERVICE_URL ??
    "http://localhost:4101";

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
    const accessToken = getAccessToken();

    if (!accessToken) {
        throw new StudentApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    const response = await fetch(
        `${enrollmentServiceUrl}/api/students/dashboard`,
        {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            signal,
            cache: "no-store",
        },
    );

    const body = (await response.json()) as
        | ApiResponse<StudentDashboardResponse>
        | ApiErrorResponse;

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