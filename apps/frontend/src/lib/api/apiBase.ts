import { getAccessToken } from "@/lib/auth/tokenStorage";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:4000";

export function buildApiUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

export function createAuthHeaders(existingHeaders?: HeadersInit): Headers {
    const headers = new Headers(existingHeaders);
    const accessToken = getAccessToken();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(buildApiUrl(path), {
        ...options,
        headers: createAuthHeaders(options.headers),
        cache: options.cache ?? "no-store",
    });
}
