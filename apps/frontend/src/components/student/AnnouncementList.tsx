import {
    Bell,
    CalendarDays,
} from "lucide-react";

import {
    EmptyState,
    LoadingSkeleton,
} from "@/components/common";
import type { AnnouncementItem } from "@/types";

interface AnnouncementListProps {
    announcements: AnnouncementItem[];
    isLoading?: boolean;
}

function formatAnnouncementDate(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const today = new Date();

    if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    ) {
        return "Today";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
    }).format(date);
}

export default function AnnouncementList({
    announcements,
    isLoading = false,
}: AnnouncementListProps) {
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
                    {Array.from({ length: 3 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="flex gap-3"
                            >
                                <LoadingSkeleton
                                    rounded="full"
                                    className="mt-1 h-3 w-3 shrink-0"
                                />

                                <div className="flex-1">
                                    <LoadingSkeleton className="h-4 w-3/5" />

                                    <LoadingSkeleton className="mt-2 h-3 w-4/5" />
                                </div>

                                <LoadingSkeleton className="h-3 w-12" />
                            </div>
                        ),
                    )}
                </div>
            ) : announcements.length === 0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={Bell}
                        title="No announcements"
                        description="There are no new announcements at this time."
                    />
                </div>
            ) : (
                <div className="divide-y divide-neutral-100 px-5">
                    {announcements.map(
                        (announcement) => (
                            <article
                                key={announcement.id}
                                className="flex gap-3 py-4"
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#35822E]"
                                />

                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-neutral-900">
                                        {
                                            announcement.title
                                        }
                                    </h3>

                                    <p className="mt-1 text-sm leading-5 text-neutral-500">
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
                        ),
                    )}
                </div>
            )}
        </section>
    );
}