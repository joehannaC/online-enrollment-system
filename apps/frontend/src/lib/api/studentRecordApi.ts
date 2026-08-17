import {
    buildApiUrl,
} from "@/lib/api/apiBase";
import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

import type {
    ApiErrorResponse,
    ApiResponse,
    StudentRecordResponse,
    StudentRecordStatus,
} from "@/types";

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

        Object.setPrototypeOf(
            this,
            StudentRecordApiError.prototype,
        );
    }
}

function buildQueryString(
    query: StudentRecordQuery,
): string {
    const searchParameters =
        new URLSearchParams();

    const normalizedSearch =
        query.search?.trim();

    if (normalizedSearch) {
        searchParameters.set(
            "search",
            normalizedSearch,
        );
    }

    if (
        query.academicYear
            ?.trim()
    ) {
        searchParameters.set(
            "academicYear",
            query.academicYear.trim(),
        );
    }

    if (query.status) {
        searchParameters.set(
            "status",
            query.status,
        );
    }

    if (
        typeof query.page ===
            "number" &&
        Number.isInteger(
            query.page,
        ) &&
        query.page > 0
    ) {
        searchParameters.set(
            "page",
            String(query.page),
        );
    }

    if (
        typeof query.limit ===
            "number" &&
        Number.isInteger(
            query.limit,
        ) &&
        query.limit > 0
    ) {
        searchParameters.set(
            "limit",
            String(query.limit),
        );
    }

    if (
        typeof query.termNumber ===
            "number" &&
        Number.isInteger(
            query.termNumber,
        ) &&
        query.termNumber > 0
    ) {
        searchParameters.set(
            "termNumber",
            String(
                query.termNumber,
            ),
        );
    }

    const queryString =
        searchParameters.toString();

    return queryString
        ? `?${queryString}`
        : "";
}

function isAbortError(
    error: unknown,
): boolean {
    return (
        error instanceof
            DOMException &&
        error.name ===
            "AbortError"
    );
}

function isApiErrorResponse(
    value: unknown,
): value is ApiErrorResponse {
    if (
        typeof value !==
            "object" ||
        value === null
    ) {
        return false;
    }

    const candidate =
        value as Partial<ApiErrorResponse>;

    return (
        candidate.success ===
            false &&
        typeof candidate.error ===
            "object" &&
        candidate.error !==
            null &&
        typeof candidate.error
            .code ===
            "string" &&
        typeof candidate.error
            .message ===
            "string"
    );
}

function getFallbackErrorMessage(
    status: number,
): string {
    if (status === 401) {
        return "Your login session has expired.";
    }

    if (status === 403) {
        return "You do not have permission to view these academic records.";
    }

    if (status === 404) {
        return "The student academic record could not be found.";
    }

    if (status >= 500) {
        return "The Enrollment Service is unavailable.";
    }

    return "The student academic records could not be loaded.";
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

    const url =
        buildApiUrl(
            `/api/students/records${buildQueryString(
                query,
            )}`,
        );

    let response: Response;

    try {
        response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    cache:
                        "no-store",

                    signal,
                },
            );
    } catch (error) {
        if (
            isAbortError(
                error,
            )
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

    let body: unknown;

    try {
        body =
            await response.json();
    } catch {
        throw new StudentRecordApiError(
            "INVALID_SERVICE_RESPONSE",
            response.ok
                ? "The Enrollment Service returned an invalid response."
                : getFallbackErrorMessage(
                    response.status,
                ),
            response.status ||
                502,
            "enrollment-service",
        );
    }

    if (!response.ok) {
        if (
            isApiErrorResponse(
                body,
            )
        ) {
            throw new StudentRecordApiError(
                body.error.code,
                body.error.message,
                response.status,
                body.error.service,
            );
        }

        throw new StudentRecordApiError(
            response.status >= 500
                ? "ENROLLMENT_SERVICE_UNAVAILABLE"
                : "STUDENT_RECORD_REQUEST_FAILED",
            getFallbackErrorMessage(
                response.status,
            ),
            response.status,
            "enrollment-service",
        );
    }

    const apiResponse =
        body as ApiResponse<StudentRecordResponse>;

    if (
        apiResponse.success !==
            true ||
        !apiResponse.data
    ) {
        throw new StudentRecordApiError(
            "INVALID_SERVICE_RESPONSE",
            "The Enrollment Service returned an invalid response.",
            502,
            "enrollment-service",
        );
    }

    return apiResponse.data;
}