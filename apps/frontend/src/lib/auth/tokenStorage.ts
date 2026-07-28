import type { AuthUser } from "@/types/auth.types";

const ACCESS_TOKEN_KEY = "enrollment_access_token";
const AUTH_USER_KEY = "enrollment_auth_user";

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

export function saveAuthSession(
    accessToken: string,
    user: AuthUser,
): void {
    if (!isBrowser()) {
        return;
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify(user),
    );
}

export function getAccessToken(): string | null {
    if (!isBrowser()) {
        return null;
    }

    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
    if (!isBrowser()) {
        return null;
    }

    const storedUser = sessionStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser) as AuthUser;
    } catch {
        clearAuthSession();
        return null;
    }
}

export function clearAuthSession(): void {
    if (!isBrowser()) {
        return;
    }

    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
}