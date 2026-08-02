import { buildApiUrl } from "@/lib/api/apiBase";
import type {
    LoginApiResponse,
    LoginRequest,
} from "@/types/auth.types";

export class ApiRequestError extends Error {
    public readonly status: number;
    public readonly code?: string;

    constructor(
        message: string,
        status: number,
        code?: string,
    ) {
        super(message);

        this.name = "ApiRequestError";
        this.status = status;
        this.code = code;
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
    let response: Response;

    try {
        response = await fetch(
            buildApiUrl("/api/auth/login"),
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                    Accept:
                        "application/json",
                },

                body: JSON.stringify(
                    credentials,
                ),

                cache: "no-store",
            },
        );
    } catch {
        throw new ApiRequestError(
            "The authentication service is unavailable.",
            503,
            "SERVICE_UNAVAILABLE",
        );
    }

    let body: LoginResponseBody;

    try {
        body =
            (await response.json()) as
                LoginResponseBody;
    } catch {
        throw new ApiRequestError(
            "The authentication service returned an invalid response.",
            response.status || 502,
            "INVALID_SERVICE_RESPONSE",
        );
    }

    if (
        !response.ok ||
        !body.success ||
        !body.data
    ) {
        throw new ApiRequestError(
            body.error?.message ??
                "Login failed.",
            response.status,
            body.error?.code,
        );
    }

    return body.data;
}