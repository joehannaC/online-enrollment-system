"use client";

import {
    BookOpen,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    NotebookTabs,
    SquareUserRound,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
    usePathname,
    useRouter,
} from "next/navigation";
import {
    useEffect,
    useState,
} from "react";

import {
    clearTabAuthSession,
    getStoredAuthUser,
} from "@/lib/auth/tokenStorage";
import type {
    AuthUser,
    UserRole,
} from "@/types";

interface NavigationItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface AppSidebarProps {
    role: UserRole;
}

const studentNavigation: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Records",
        href: "/student/records",
        icon: NotebookTabs,
    },
    {
        label: "Grades",
        href: "/student/grades",
        icon: GraduationCap,
    },
    {
        label: "Enrollment",
        href: "/student/enrollment",
        icon: ClipboardList,
    },
    {
        label: "Profile",
        href: "/student/profile",
        icon: SquareUserRound,
    },
];

const facultyNavigation: NavigationItem[] = [
    {
        label: "Dashboard",
        href: "/faculty/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Subjects",
        href: "/faculty/subjects",
        icon: BookOpen,
    },
    {
        label: "Grade Entry",
        href: "/faculty/grade-entry",
        icon: GraduationCap,
    },
    {
        label: "Records",
        href: "/faculty/records",
        icon: NotebookTabs,
    },
    {
        label: "Profile",
        href: "/faculty/profile",
        icon: SquareUserRound,
    },
];

function getUserInitials(
    user: AuthUser | null,
): string {
    if (!user) {
        return "--";
    }

    const firstInitial =
        user.profile.firstName
            ?.trim()
            .charAt(0)
            .toUpperCase() ?? "";

    const lastInitial =
        user.profile.lastName
            ?.trim()
            .charAt(0)
            .toUpperCase() ?? "";

    const initials =
        `${firstInitial}${lastInitial}`;

    if (initials) {
        return initials;
    }

    return user.username
        .slice(0, 2)
        .toUpperCase();
}

export default function AppSidebar({
    role,
}: AppSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [
        loggedInUser,
        setLoggedInUser,
    ] = useState<AuthUser | null>(null);

    useEffect(() => {
        const storedUser =
            getStoredAuthUser();

        setLoggedInUser(storedUser);
    }, []);

    const navigationItems =
        role === "STUDENT"
            ? studentNavigation
            : facultyNavigation;

    const initials =
        getUserInitials(loggedInUser);

    function handleSignOut(): void {
        clearTabAuthSession();
        router.replace("/login");
    }

    return (
        <aside
            className="
                fixed inset-y-0 left-0 z-40
                hidden w-[88px]
                flex-col bg-[#35822E]
                text-white shadow-lg
                lg:flex
            "
        >
            <div className="flex h-24 items-center justify-center">
                <div
                    title={
                        loggedInUser
                            ?.profile
                            .displayName ??
                        "Logged-in user"
                    }
                    aria-label={
                        loggedInUser
                            ? `${loggedInUser.profile.displayName} profile`
                            : "User profile"
                    }
                    className="
                        flex h-12 w-12 items-center
                        justify-center rounded-full
                        border border-white/60
                        bg-white/95 text-sm font-bold
                        text-[#35822E]
                    "
                >
                    {initials}
                </div>
            </div>

            <nav className="flex flex-1 flex-col gap-2 px-2">
                {navigationItems.map(
                    (item) => {
                        const Icon =
                            item.icon;

                        const isActive =
                            pathname ===
                                item.href ||
                            pathname.startsWith(
                                `${item.href}/`,
                            );

                        return (
                            <Link
                                key={
                                    item.href
                                }
                                href={
                                    item.href
                                }
                                aria-current={
                                    isActive
                                        ? "page"
                                        : undefined
                                }
                                className={[
                                    "group relative flex min-h-[66px] flex-col items-center justify-center gap-1.5",
                                    "rounded-xl px-2 text-[11px] font-medium transition",
                                    isActive
                                        ? "bg-white text-[#35822E]"
                                        : "text-white/90 hover:bg-white/10 hover:text-white",
                                ].join(
                                    " ",
                                )}
                            >
                                {isActive ? (
                                    <span
                                        aria-hidden="true"
                                        className="
                                            absolute -left-2
                                            h-10 w-1
                                            rounded-r-full
                                            bg-white
                                        "
                                    />
                                ) : null}

                                <Icon
                                    aria-hidden="true"
                                    className="h-6 w-6"
                                    strokeWidth={
                                        1.8
                                    }
                                />

                                <span className="text-center leading-tight">
                                    {
                                        item.label
                                    }
                                </span>
                            </Link>
                        );
                    },
                )}
            </nav>

            <div className="p-2 pb-5">
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="
                        flex min-h-[66px] w-full
                        flex-col items-center justify-center
                        gap-1.5 rounded-xl
                        px-2 text-[11px] font-medium
                        text-white/90 transition
                        hover:bg-white/10 hover:text-white
                    "
                >
                    <LogOut
                        aria-hidden="true"
                        className="h-6 w-6"
                        strokeWidth={1.8}
                    />

                    Sign out
                </button>
            </div>
        </aside>
    );
}