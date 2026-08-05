"use client";

import {
    type ReactNode,
    useEffect,
    useState,
} from "react";
import {
    useRouter,
} from "next/navigation";

import {
    getAccessToken,
    getStoredAuthUser,
} from "@/lib/auth/tokenStorage";

type SupportedRole =
    | "STUDENT"
    | "FACULTY";

interface AuthGuardProps {
    children: ReactNode;
    allowedRole: SupportedRole;
}

function normalizeRole(
    role: unknown,
): SupportedRole | null {
    const normalizedRole =
        String(role ?? "")
            .trim()
            .toUpperCase();

    if (
        normalizedRole === "STUDENT" ||
        normalizedRole === "FACULTY"
    ) {
        return normalizedRole;
    }

    return null;
}

function getDashboardPath(
    role: SupportedRole,
): string {
    return role === "STUDENT"
        ? "/student/dashboard"
        : "/faculty/dashboard";
}

export default function AuthGuard({
    children,
    allowedRole,
}: AuthGuardProps) {
    const router = useRouter();

    const [
        guardState,
        setGuardState,
    ] = useState<
        | "CHECKING"
        | "AUTHORIZED"
        | "REDIRECTING"
    >("CHECKING");

    useEffect(() => {
        let isActive = true;

        function updateState(
            state:
                | "AUTHORIZED"
                | "REDIRECTING",
        ): void {
            if (isActive) {
                setGuardState(state);
            }
        }

        try {
            const accessToken =
                getAccessToken();

            const storedUser =
                getStoredAuthUser();

            if (
                !accessToken ||
                !storedUser
            ) {
                updateState(
                    "REDIRECTING",
                );
                router.replace("/login");
                return;
            }

            const normalizedRole =
                normalizeRole(
                    storedUser.role,
                );

            if (!normalizedRole) {
                updateState(
                    "REDIRECTING",
                );
                router.replace("/login");
                return;
            }

            if (
                normalizedRole !==
                allowedRole
            ) {
                updateState(
                    "REDIRECTING",
                );

                router.replace(
                    getDashboardPath(
                        normalizedRole,
                    ),
                );
                return;
            }

            updateState(
                "AUTHORIZED",
            );
        } catch (error) {
            console.error(
                "[AuthGuard] Failed to read the authentication session:",
                error,
            );

            updateState(
                "REDIRECTING",
            );
            router.replace("/login");
        }

        return () => {
            isActive = false;
        };
    }, [
        allowedRole,
        router,
    ]);

    if (
        guardState !==
        "AUTHORIZED"
    ) {
        return (
            <main
                className="
                    flex min-h-screen
                    items-center
                    justify-center
                    bg-[#35822E]
                "
            >
                <div className="text-center">
                    <div
                        role="status"
                        aria-label={
                            guardState ===
                            "CHECKING"
                                ? "Checking your session"
                                : "Redirecting"
                        }
                        className="
                            mx-auto
                            h-8 w-8
                            animate-spin
                            rounded-full
                            border-4
                            border-white/30
                            border-t-white
                        "
                    />

                    <p
                        className="
                            mt-4 text-sm
                            text-white/80
                        "
                    >
                        {guardState ===
                        "CHECKING"
                            ? "Checking your session..."
                            : "Redirecting..."}
                    </p>
                </div>
            </main>
        );
    }

    return children;
}