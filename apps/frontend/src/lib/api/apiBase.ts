import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

/*
 * Empty means "use the same origin as the frontend".
 *
 * Example:
 * https://h61zcjl1-3001.asse.devtunnels.ms/api/auth/login
 */
export const API_BASE_URL =
    process.env
        .NEXT_PUBLIC_API_BASE_URL
        ?.trim() ??
    "";

export function buildApiUrl(
    path: string,
): string {
    const normalizedPath =
        path.startsWith("/")
            ? path
            : `/${path}`;

    return `${API_BASE_URL}${normalizedPath}`;
}

export function createAuthHeaders(
    existingHeaders?: HeadersInit,
): Headers {
    const headers =
        new Headers(
            existingHeaders,
        );

    const accessToken =
        getAccessToken();

    if (accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${accessToken}`,
        );
    }

    return headers;
}

export async function apiFetch(
    path: string,
    options: RequestInit = {},
): Promise<Response> {
    return fetch(
        buildApiUrl(path),
        {
            ...options,

            headers:
                createAuthHeaders(
                    options.headers,
                ),

            cache:
                options.cache ??
                "no-store",
        },
    );
}