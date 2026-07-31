import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";
import type {
    ApiErrorResponse,
    ApiResponse,
    StudentGradeResponse,
    StudentGradeStatus,
} from "@/types";

export interface StudentGradeQuery {
    search?: string;

    academicYear?: string;
    termNumber?: number;

    status?: StudentGradeStatus;

    page?: number;
    limit?: number;
}

export class StudentGradeApiError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
    ) {
        super(message);

        this.name =
            "StudentGradeApiError";
    }
}

function buildQueryString(
    query: StudentGradeQuery,
): string {
    const parameters =
        new URLSearchParams();

    if (query.search?.trim()) {
        parameters.set(
            "search",
            query.search.trim(),
        );
    }

    if (query.academicYear) {
        parameters.set(
            "academicYear",
            query.academicYear,
        );
    }

    if (query.termNumber) {
        parameters.set(
            "termNumber",
            String(
                query.termNumber,
            ),
        );
    }

    if (query.status) {
        parameters.set(
            "status",
            query.status,
        );
    }

    if (query.page) {
        parameters.set(
            "page",
            String(query.page),
        );
    }

    if (query.limit) {
        parameters.set(
            "limit",
            String(query.limit),
        );
    }

    const value =
        parameters.toString();

    return value
        ? `?${value}`
        : "";
}

export async function getStudentGrades(
    query: StudentGradeQuery,
    signal?: AbortSignal,
): Promise<StudentGradeResponse> {
    const token =
        getAccessToken();

    if (!token) {
        throw new StudentGradeApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    let response: Response;

    try {
        response = await fetch(
            `/api/students/grades${buildQueryString(
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

                cache:
                    "no-store",

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

        throw new StudentGradeApiError(
            "GRADE_SERVICE_UNAVAILABLE",
            "The Grade Service is unavailable.",
            503,
            "grade-service",
        );
    }

    let body:
        | ApiResponse<StudentGradeResponse>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<StudentGradeResponse>
                | ApiErrorResponse;
    } catch {
        throw new StudentGradeApiError(
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

        throw new StudentGradeApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
        );
    }

    return body.data;
}