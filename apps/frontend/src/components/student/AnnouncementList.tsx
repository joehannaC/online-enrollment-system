import {
    Bell,
    BookOpenCheck,
    CalendarDays,
    ClipboardCheck,
    GraduationCap,
} from "lucide-react";

import {
    EmptyState,
    LoadingSkeleton,
} from "@/components/common";
import type {
    AnnouncementItem,
} from "@/types";

interface AnnouncementListProps {
    announcements:
        AnnouncementItem[];

    isLoading?: boolean;
}

function formatAnnouncementDate(
    value: string,
): string {
    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    const today = new Date();

    const isToday =
        date.getFullYear() ===
            today.getFullYear() &&
        date.getMonth() ===
            today.getMonth() &&
        date.getDate() ===
            today.getDate();

    if (isToday) {
        return new Intl.DateTimeFormat(
            "en-PH",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone:
                    "Asia/Manila",
            },
        ).format(date);
    }

    return new Intl.DateTimeFormat(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone:
                "Asia/Manila",
        },
    ).format(date);
}

function getAnnouncementCategory(
    announcement: AnnouncementItem,
):
    | "ENROLLMENT"
    | "GRADE"
    | "CURRICULUM"
    | "GENERAL" {
    const content =
        `${announcement.title} ${announcement.message}`
            .toLowerCase();

    if (
        content.includes(
            "enrollment",
        )
    ) {
        return "ENROLLMENT";
    }

    if (
        content.includes(
            "grade",
        )
    ) {
        return "GRADE";
    }

    if (
        content.includes(
            "curriculum",
        ) ||
        content.includes(
            "academic record",
        ) ||
        content.includes(
            "earned units",
        )
    ) {
        return "CURRICULUM";
    }

    return "GENERAL";
}

function getAnnouncementIcon(
    announcement: AnnouncementItem,
) {
    const category =
        getAnnouncementCategory(
            announcement,
        );

    switch (category) {
        case "ENROLLMENT":
            return ClipboardCheck;

        case "GRADE":
            return BookOpenCheck;

        case "CURRICULUM":
            return GraduationCap;

        default:
            return Bell;
    }
}

function getAnnouncementIconClasses(
    announcement: AnnouncementItem,
): string {
    const category =
        getAnnouncementCategory(
            announcement,
        );

    switch (category) {
        case "ENROLLMENT":
            return "bg-blue-50 text-blue-700";

        case "GRADE":
            return "bg-green-50 text-green-700";

        case "CURRICULUM":
            return "bg-amber-50 text-amber-700";

        default:
            return "bg-neutral-100 text-neutral-700";
    }
}

export default function AnnouncementList({
    announcements,
    isLoading = false,
}: AnnouncementListProps) {
    const sortedAnnouncements =
        [...announcements].sort(
            (
                first,
                second,
            ) =>
                new Date(
                    second.publishedAt,
                ).getTime() -
                new Date(
                    first.publishedAt,
                ).getTime(),
        );

    const shouldScroll =
        sortedAnnouncements.length >
        2;

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
                <Bell
                    aria-hidden="true"
                    className="h-5 w-5 text-[#35822E]"
                />

                <h2 className="text-lg font-semibold text-[#35822E]">
                    Announcements
                </h2>
            </header>

            {isLoading ? (
                <div className="space-y-5 p-5">
                    {Array.from({
                        length: 2,
                    }).map(
                        (
                            _,
                            index,
                        ) => (
                            <div
                                key={index}
                                className="flex gap-3"
                            >
                                <LoadingSkeleton
                                    rounded="full"
                                    className="h-10 w-10 shrink-0"
                                />

                                <div className="flex-1">
                                    <LoadingSkeleton className="h-4 w-3/5" />

                                    <LoadingSkeleton className="mt-2 h-3 w-4/5" />
                                </div>

                                <LoadingSkeleton className="h-3 w-16" />
                            </div>
                        ),
                    )}
                </div>
            ) : sortedAnnouncements.length ===
            0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={Bell}
                        title="No announcements"
                        description="There are no new announcements at this time."
                    />
                </div>
            ) : (
                <div
                    className={[
                        "divide-y divide-neutral-100 px-5",

                        shouldScroll
                            ? "max-h-[240px] overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin]"
                            : "overflow-hidden",
                    ].join(" ")}
                >
                    {sortedAnnouncements.map(
                        (
                            announcement,
                        ) => {
                            const Icon =
                                getAnnouncementIcon(
                                    announcement,
                                );

                            return (
                                <article
                                    key={
                                        announcement.id
                                    }
                                    className="flex gap-3 py-4"
                                >
                                    <div
                                        className={[
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                            getAnnouncementIconClasses(
                                                announcement,
                                            ),
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-neutral-900">
                                            {
                                                announcement.title
                                            }
                                        </h3>

                                        <p className="mt-1 break-words text-sm leading-5 text-neutral-500">
                                            {
                                                announcement.message
                                            }
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-start gap-1 text-xs text-neutral-400">
                                        <CalendarDays className="h-3.5 w-3.5" />

                                        <span>
                                            {formatAnnouncementDate(
                                                announcement.publishedAt,
                                            )}
                                        </span>
                                    </div>
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}