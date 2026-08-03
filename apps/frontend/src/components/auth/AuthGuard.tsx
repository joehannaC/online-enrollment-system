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
                "
            >
                <p className="text-sm text-neutral-500">
                    Checking your session...
                </p>
            </main>
        );
    }

    return children;
}