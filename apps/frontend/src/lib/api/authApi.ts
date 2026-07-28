import type {
  LoginApiResponse,
  LoginRequest,
} from "@/types/auth.types";

const authApiUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL;

    if (!authApiUrl) {
    throw new Error(
        "NEXT_PUBLIC_AUTH_API_URL is not configured.",
    );
}

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

export async function login(
    credentials: LoginRequest,
): Promise<LoginApiResponse["data"]> {
    let response: Response;

    try {
        response = await fetch(
        `${authApiUrl}/api/auth/login`,
        {
            method: "POST",

            headers: {
            "Content-Type": "application/json",
            },

            body: JSON.stringify(credentials),
        },
        );
    } catch {
        throw new ApiRequestError(
        "The authentication service is unavailable.",
        503,
        "SERVICE_UNAVAILABLE",
        );
    }

    const body = (await response.json()) as {
        success: boolean;
        data?: LoginApiResponse["data"];
        error?: {
        code?: string;
        message?: string;
        };
    };

    if (!response.ok || !body.success || !body.data) {
        throw new ApiRequestError(
        body.error?.message ?? "Login failed.",
        response.status,
        body.error?.code,
        );
    }

    return body.data;
}