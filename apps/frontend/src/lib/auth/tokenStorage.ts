import type {
    AuthUser,
} from "@/types";

const ACCESS_TOKEN_KEY =
    "online-enrollment-access-token";

const AUTH_USER_KEY =
    "online-enrollment-auth-user";

export function saveAuthSession(
    accessToken: string,
    user: AuthUser,
): void {
    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    sessionStorage.setItem(
        ACCESS_TOKEN_KEY,
        accessToken,
    );

    sessionStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify(user),
    );
}

export function getAccessToken():
    | string
    | null {
    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    return sessionStorage.getItem(
        ACCESS_TOKEN_KEY,
    );
}

export function getStoredAuthUser():
    | AuthUser
    | null {
    if (
        typeof window ===
        "undefined"
    ) {
        return null;
    }

    const value =
        sessionStorage.getItem(
            AUTH_USER_KEY,
        );

    if (!value) {
        return null;
    }

    try {
        const user =
            JSON.parse(
                value,
            ) as AuthUser;

        if (
            !user ||
            typeof user !==
                "object" ||
            !user.role
        ) {
            throw new Error(
                "Invalid stored user.",
            );
        }

        return user;
    } catch {
        clearTabAuthSession();

        return null;
    }
}

export function clearTabAuthSession(): void {
    if (
        typeof window ===
        "undefined"
    ) {
        return;
    }

    sessionStorage.removeItem(
        ACCESS_TOKEN_KEY,
    );

    sessionStorage.removeItem(
        AUTH_USER_KEY,
    );
}

export function clearAuthSession(): void {
    clearTabAuthSession();
}