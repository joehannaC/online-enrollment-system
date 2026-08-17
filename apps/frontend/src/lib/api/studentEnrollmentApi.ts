import { buildApiUrl } from "@/lib/api/apiBase";
import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";
import type {
    ApiErrorResponse,
    ApiResponse,
    StudentEnrollmentResponse,
    SubmitEnrollmentResult,
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

function createIdempotencyKey(): string {
    const cryptoApi =
        globalThis.crypto;

    if (
        cryptoApi &&
        typeof cryptoApi.randomUUID ===
            "function"
    ) {
        return cryptoApi.randomUUID();
    }

    if (
        cryptoApi &&
        typeof cryptoApi.getRandomValues ===
            "function"
    ) {
        const bytes =
            new Uint8Array(16);

        cryptoApi.getRandomValues(
            bytes,
        );

        bytes[6] =
            (bytes[6] & 0x0f) |
            0x40;

        bytes[8] =
            (bytes[8] & 0x3f) |
            0x80;

        const hex =
            Array.from(
                bytes,
                (byte) =>
                    byte
                        .toString(16)
                        .padStart(2, "0"),
            );

        return [
            hex
                .slice(0, 4)
                .join(""),
            hex
                .slice(4, 6)
                .join(""),
            hex
                .slice(6, 8)
                .join(""),
            hex
                .slice(8, 10)
                .join(""),
            hex
                .slice(10, 16)
                .join(""),
        ].join("-");
    }

    return [
        Date.now().toString(16),
        Math.random()
            .toString(16)
            .slice(2),
        Math.random()
            .toString(16)
            .slice(2),
    ].join("-");
}

function createServiceUnavailableError():
    StudentEnrollmentApiError {
    return new StudentEnrollmentApiError(
        "ENROLLMENT_SERVICE_UNAVAILABLE",
        "The Enrollment Service is unavailable.",
        503,
        "enrollment-service",
    );
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
            errorBody.error?.code ??
                "ENROLLMENT_REQUEST_FAILED",

            errorBody.error?.message ??
                "The enrollment request could not be completed.",

            response.status || 500,

            errorBody.error?.service ??
                "enrollment-service",

            errorBody.error?.details,
        );
    }

    return (
        body as ApiResponse<T>
    ).data;
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
            buildApiUrl(
                `/api/students/enrollment?${parameters.toString()}`,
            ),
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

        console.warn(
            "[studentEnrollmentApi] Failed to retrieve enrollment:",
            error instanceof Error
                ? error.message
                : "Unknown network error",
        );

        throw createServiceUnavailableError();
    }

    return parseApiResponse<StudentEnrollmentResponse>(
        response,
    );
}

export async function addEnrollmentDraftItem(
    sectionId: string,
    expectedVersion: number,
): Promise<void> {
    let response: Response;

    try {
        response = await fetch(
            buildApiUrl(
                "/api/students/enrollment/draft/items",
            ),
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
    } catch (error) {
        console.warn(
            "[studentEnrollmentApi] Failed to add draft item:",
            error instanceof Error
                ? error.message
                : "Unknown network error",
        );

        throw createServiceUnavailableError();
    }

    await parseApiResponse<{
        message: string;
    }>(response);
}

export async function removeEnrollmentDraftItem(
    itemId: string,
    expectedVersion: number,
): Promise<void> {
    let response: Response;

    try {
        response = await fetch(
            buildApiUrl(
                `/api/students/enrollment/draft/items/${itemId}`,
            ),
            {
                method: "DELETE",

                headers:
                    getAuthorizationHeaders(),

                body: JSON.stringify({
                    expectedVersion,
                }),
            },
        );
    } catch (error) {
        console.warn(
            "[studentEnrollmentApi] Failed to remove draft item:",
            error instanceof Error
                ? error.message
                : "Unknown network error",
        );

        throw createServiceUnavailableError();
    }

    await parseApiResponse<{
        message: string;
    }>(response);
}

export async function submitStudentEnrollment(
    expectedVersion: number,
): Promise<SubmitEnrollmentResult> {

    const idempotencyKey =
        createIdempotencyKey();

    let response: Response;

    try {
        response = await fetch(
            buildApiUrl(
                "/api/students/enrollment/submit",
            ),
            {
                method: "POST",

                headers:
                    getAuthorizationHeaders(),

                body: JSON.stringify({
                    expectedVersion,
                    idempotencyKey,
                }),
            },
        );
    } catch (error) {
        console.warn(
            "[studentEnrollmentApi] Failed to submit enrollment:",
            error instanceof Error
                ? error.message
                : "Unknown network error",
        );

        throw createServiceUnavailableError();
    }

    return parseApiResponse<SubmitEnrollmentResult>(
        response,
    );
}