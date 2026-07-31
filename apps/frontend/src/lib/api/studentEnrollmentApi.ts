import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";
import type {
    ApiErrorResponse,
    ApiResponse,
    StudentEnrollmentResponse,
} from "@/types";

export interface EnrollmentListQuery {
    search?: string;

    availability?:
        | "ALL"
        | "OPEN"
        | "FULL";

    page?: number;
    limit?: number;
}

export class StudentEnrollmentApiError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly service?: string,
        public readonly details?: Record<
            string,
            unknown
        >,
    ) {
        super(message);

        this.name =
            "StudentEnrollmentApiError";
    }
}

function getAuthorizationHeaders(): HeadersInit {
    const token =
        getAccessToken();

    if (!token) {
        throw new StudentEnrollmentApiError(
            "AUTH_TOKEN_MISSING",
            "Your login session could not be found.",
            401,
            "frontend",
        );
    }

    return {
        Accept:
            "application/json",

        "Content-Type":
            "application/json",

        Authorization:
            `Bearer ${token}`,
    };
}

async function parseApiResponse<T>(
    response: Response,
): Promise<T> {
    let body:
        | ApiResponse<T>
        | ApiErrorResponse;

    try {
        body =
            (await response.json()) as
                | ApiResponse<T>
                | ApiErrorResponse;
    } catch {
        throw new StudentEnrollmentApiError(
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

        throw new StudentEnrollmentApiError(
            errorBody.error.code,
            errorBody.error.message,
            response.status,
            errorBody.error.service,
            errorBody.error.details,
        );
    }

    return body.data;
}

export async function getStudentEnrollment(
    query: EnrollmentListQuery = {},
    signal?: AbortSignal,
): Promise<StudentEnrollmentResponse> {
    const parameters =
        new URLSearchParams();

    if (query.search?.trim()) {
        parameters.set(
            "search",
            query.search.trim(),
        );
    }

    if (query.availability) {
        parameters.set(
            "availability",
            query.availability,
        );
    }

    parameters.set(
        "page",
        String(query.page ?? 1),
    );

    parameters.set(
        "limit",
        String(query.limit ?? 10),
    );

    let response: Response;

    try {
        response = await fetch(
            `/api/students/enrollment?${parameters.toString()}`,
            {
                method: "GET",

                headers:
                    getAuthorizationHeaders(),

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

        throw new StudentEnrollmentApiError(
            "ENROLLMENT_SERVICE_UNAVAILABLE",
            "The Enrollment Service is unavailable.",
            503,
            "enrollment-service",
        );
    }

    return parseApiResponse<StudentEnrollmentResponse>(
        response,
    );
}

export async function addEnrollmentDraftItem(
    sectionId: string,
    expectedVersion: number,
): Promise<void> {
    const response =
        await fetch(
            "/api/students/enrollment/draft/items",
            {
                method: "POST",

                headers:
                    getAuthorizationHeaders(),

                body: JSON.stringify({
                    sectionId,
                    expectedVersion,
                }),
            },
        );

    await parseApiResponse<{
        message: string;
    }>(response);
}

export async function removeEnrollmentDraftItem(
    itemId: string,
    expectedVersion: number,
): Promise<void> {
    const response =
        await fetch(
            `/api/students/enrollment/draft/items/${itemId}`,
            {
                method: "DELETE",

                headers:
                    getAuthorizationHeaders(),

                body: JSON.stringify({
                    expectedVersion,
                }),
            },
        );

    await parseApiResponse<{
        message: string;
    }>(response);
}

export async function submitStudentEnrollment(
    expectedVersion: number,
): Promise<void> {
    const response =
        await fetch(
            "/api/students/enrollment/submit",
            {
                method: "POST",

                headers:
                    getAuthorizationHeaders(),

                body: JSON.stringify({
                    expectedVersion,

                    idempotencyKey:
                        globalThis.crypto
                            .randomUUID(),
                }),
            },
        );

    await parseApiResponse<{
        message: string;
    }>(response);
}