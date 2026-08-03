"use client";

import {
    type ReactNode,
    useEffect,
    useState,
} from "react";

import {
    usePathname,
    useRouter,
} from "next/navigation";

import {
    getAccessToken,
    getStoredAuthUser,
} from "@/lib/auth/tokenStorage";

interface AuthGuardProps {
    children: ReactNode;
    allowedRole:
        | "STUDENT"
        | "FACULTY";
}

export default function AuthGuard({
    children,
    allowedRole,
}: AuthGuardProps) {
    const router =
        useRouter();

    const pathname =
        usePathname();

    const [
        isChecking,
        setIsChecking,
    ] = useState(true);

    useEffect(() => {
        const accessToken =
            getAccessToken();

        const user =
            getStoredAuthUser();

        if (
            !accessToken ||
            !user
        ) {
            router.replace(
                "/login",
            );

            return;
        }

        if (
            user.role !==
            allowedRole
        ) {
            router.replace(
                user.role ===
                    "STUDENT"
                    ? "/student/dashboard"
                    : "/faculty/dashboard",
            );

            return;
        }

        setIsChecking(false);
    }, [
        allowedRole,
        pathname,
        router,
    ]);

    if (isChecking) {
        return (
            <main
                className="
                    flex min-h-screen
                    items-center
                    justify-center
                    bg-[#35822E]
                "
            >
                <div
                    role="status"
                    aria-label="Checking your session"
                    className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"
                />
            </main>
        );
    }

    return children;
}