import type {
    ApiErrorResponse,
    ApiResponse,
    StudentProfileResponse,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

const enrollmentServiceUrl =
    process.env
        .NEXT_PUBLIC_ENROLLMENT_SERVICE_URL ??
    "http://localhost:4101";

export class StudentProfileApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name =
            "StudentProfileApiError";
    }
}

export async function getStudentProfile(
    signal?: AbortSignal,
): Promise<StudentProfileResponse> {
    const token = getAccessToken();

    if (!token) {
        throw new StudentProfileApiError(
            "AUTH_TOKEN_MISSING",
            "Your session could not be found.",
            401,
        );
    }

    const response = await fetch(
        `${enrollmentServiceUrl}/api/students/profile`,
        {
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

    const body = (await response.json()) as
        | ApiResponse<StudentProfileResponse>
        | ApiErrorResponse;

    if (
        !response.ok ||
        body.success === false
    ) {
        const errorBody =
            body as ApiErrorResponse;

        throw new StudentProfileApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
        );
    }

    return body.data;
}