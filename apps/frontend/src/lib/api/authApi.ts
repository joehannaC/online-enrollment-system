import {
    buildApiUrl,
} from "@/lib/api/apiBase";

import type {
    LoginApiResponse,
    LoginRequest,
} from "@/types/auth.types";

export class ApiRequestError
    extends Error {
    public readonly status: number;
    public readonly code?: string;

    constructor(
        message: string,
        status: number,
        code?: string,
    ) {
        super(message);

        this.name =
            "ApiRequestError";

        this.status =
            status;

        this.code =
            code;
    }
}

interface LoginResponseBody {
    success: boolean;

    data?: LoginApiResponse["data"];

    error?: {
        code?: string;
        message?: string;
    };
}

export async function login(
    credentials: LoginRequest,
): Promise<LoginApiResponse["data"]> {
    const url =
        buildApiUrl(
            "/api/auth/login",
        );

    console.log(
        "[authApi] Login request:",
        url,
    );

    let response: Response;

    try {
        response =
            await fetch(
                url,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json",
                    },

                    body:
                        JSON.stringify(
                            credentials,
                        ),

                    cache:
                        "no-store",
                },
            );
    } catch (error) {
        console.error(
            "[authApi] Network error:",
            error,
        );

        throw new ApiRequestError(
            "The authentication service is unavailable.",
            503,
            "SERVICE_UNAVAILABLE",
        );
    }

    let body:
        LoginResponseBody;

    try {
        body =
            (await response.json()) as
                LoginResponseBody;
    } catch {
        throw new ApiRequestError(
            `The authentication service returned an invalid response with status ${response.status}.`,
            response.status ||
                502,
            "INVALID_SERVICE_RESPONSE",
        );
    }

    if (
        !response.ok ||
        !body.success ||
        !body.data
    ) {
        const code =
            body.error?.code;

        if (
            response.status ===
                503 ||
            code ===
                "UPSTREAM_SERVICE_UNAVAILABLE"
        ) {
            throw new ApiRequestError(
                "The authentication service is unavailable.",
                503,
                code,
            );
        }

        throw new ApiRequestError(
            body.error?.message ??
                `Login failed with status ${response.status}.`,
            response.status,
            code,
        );
    }

    return body.data;
}