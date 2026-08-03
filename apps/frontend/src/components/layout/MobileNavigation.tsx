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
    clearTabAuthSession,
} from "@/lib/auth/tokenStorage";
import type {
    UserRole,
} from "@/types";

interface MobileNavigationItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

interface MobileNavigationProps {
    role: UserRole;
}

const studentItems: MobileNavigationItem[] = [
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
        label: "Enroll",
        href: "/student/enrollment",
        icon: ClipboardList,
    },
    {
        label: "Profile",
        href: "/student/profile",
        icon: SquareUserRound,
    },
];

const facultyItems: MobileNavigationItem[] = [
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
        label: "Grades",
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

export default function MobileNavigation({
    role,
}: MobileNavigationProps) {
    const pathname = usePathname();
    const router = useRouter();

    const items =
        role === "STUDENT"
            ? studentItems
            : facultyItems;

    function handleSignOut(): void {
        clearTabAuthSession();

        router.replace("/login");
    }
    
    return (
        <nav
            aria-label="Mobile navigation"
            className="
                fixed inset-x-0 bottom-0 z-50
                border-t border-neutral-200
                bg-white/95 px-1
                pb-[env(safe-area-inset-bottom)]
                shadow-[0_-8px_24px_rgba(0,0,0,0.08)]
                backdrop-blur
                lg:hidden
            "
        >
            <div className="grid grid-cols-6">
                {items.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(
                            `${item.href}/`,
                        );

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={
                                isActive
                                    ? "page"
                                    : undefined
                            }
                            className={[
                                "relative flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1",
                                "px-0.5 text-[9px] font-medium transition",
                                isActive
                                    ? "text-[#35822E]"
                                    : "text-neutral-500 hover:text-[#35822E]",
                            ].join(" ")}
                        >
                            {isActive ? (
                                <span
                                    aria-hidden="true"
                                    className="
                                        absolute top-0
                                        h-1 w-7
                                        rounded-b-full
                                        bg-[#35822E]
                                    "
                                />
                            ) : null}

                            <Icon
                                aria-hidden="true"
                                className="h-5 w-5"
                                strokeWidth={
                                    isActive
                                        ? 2.2
                                        : 1.8
                                }
                            />

                            <span className="w-full truncate text-center">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="
                        relative flex min-h-[68px]
                        min-w-0 flex-col
                        items-center justify-center
                        gap-1 px-0.5
                        text-[9px] font-medium
                        text-neutral-500
                        transition
                        hover:text-red-600
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-inset
                        focus-visible:ring-red-500
                    "
                >
                    <LogOut
                        aria-hidden="true"
                        className="h-5 w-5"
                        strokeWidth={1.8}
                    />

                    <span className="w-full truncate text-center">
                        Sign out
                    </span>
                </button>
            </div>
        </nav>
    );
}