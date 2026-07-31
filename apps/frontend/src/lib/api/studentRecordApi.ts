import type {
    ApiErrorResponse,
    ApiResponse,
    StudentRecordResponse,
    StudentRecordStatus,
} from "@/types";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

export interface StudentRecordQuery {
    search?: string;
    academicYear?: string;
    termNumber?: number;
    status?: StudentRecordStatus;
    page?: number;
    limit?: number;
}

export class StudentRecordApiError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
    ) {
        super(message);

        this.name =
            "StudentRecordApiError";
    }
}

function buildQueryString(
    query: StudentRecordQuery,
): string {
    const searchParameters =
        new URLSearchParams();

    if (query.search?.trim()) {
        searchParameters.set(
            "search",
            query.search.trim(),
        );
    }

    if (query.academicYear) {
        searchParameters.set(
            "academicYear",
            query.academicYear,
        );
    }

    if (query.status) {
        searchParameters.set(
            "status",
            query.status,
        );
    }

    if (query.page) {
        searchParameters.set(
            "page",
            String(query.page),
        );
    }

    if (query.limit) {
        searchParameters.set(
            "limit",
            String(query.limit),
        );
    }

    if (query.termNumber) {
        searchParameters.set(
            "termNumber",
            String(query.termNumber),
        );
    }

    const value =
        searchParameters.toString();

    return value
        ? `?${value}`
        : "";
}

export async function getStudentRecords(
    query: StudentRecordQuery,
    signal?: AbortSignal,
): Promise<StudentRecordResponse> {
    const token =
        getAccessToken();

    if (!token) {
        throw new StudentRecordApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    let response: Response;

    try {
        response = await fetch(
            `/api/students/records${buildQueryString(
                query,
            )}`,
            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,
                },

                cache: "no-store",
                signal,
            },
        );
    } catch (error) {
        if (
            error instanceof
                DOMException &&
            error.name ===
                "AbortError"
        ) {
            throw error;
        }

        throw new StudentRecordApiError(
            "ENROLLMENT_SERVICE_UNAVAILABLE",
            "The Enrollment Service is unavailable.",
            503,
            "enrollment-service",
        );
    }

    let body:
        | ApiResponse<StudentRecordResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<StudentRecordResponse>
                | ApiErrorResponse;
    } catch {
        throw new StudentRecordApiError(
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

        throw new StudentRecordApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
        );
    }

    return body.data;
}