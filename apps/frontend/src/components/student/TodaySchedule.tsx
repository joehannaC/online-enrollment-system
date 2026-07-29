import {
    CalendarDays,
    Clock3,
    MapPin,
} from "lucide-react";

import {
    EmptyState,
    LoadingSkeleton,
    StatusBadge,
} from "@/components/common";
import type { StudentScheduleEntry } from "@/types";

interface TodayScheduleProps {
    schedule: StudentScheduleEntry[];
    dateLabel?: string;
    isLoading?: boolean;
}

export default function TodaySchedule({
    schedule,
    dateLabel,
    isLoading = false,
}: TodayScheduleProps) {
    const resolvedDateLabel =
        dateLabel ??
        new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
        }).format(new Date());

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-5 py-4">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[#35822E]" />

                    <h2 className="text-lg font-semibold text-[#35822E]">
                        Today&apos;s Schedule
                    </h2>
                </div>

                <p className="mt-1 text-xs text-neutral-500">
                    {resolvedDateLabel}
                </p>
            </header>

            {isLoading ? (
                <div className="space-y-4 p-5">
                    {Array.from({ length: 3 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_7rem_1fr_6rem]"
                            >
                                <LoadingSkeleton className="h-5" />
                                <LoadingSkeleton className="h-5" />
                                <LoadingSkeleton className="h-5" />
                                <LoadingSkeleton className="h-7" />
                            </div>
                        ),
                    )}
                </div>
            ) : schedule.length === 0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={CalendarDays}
                        title="No classes today"
                        description="You do not have any scheduled classes today."
                    />
                </div>
            ) : (
                <div className="divide-y divide-neutral-100 px-5">
                    {schedule.map((item) => (
                        <article
                            key={`${item.enrollmentId}-${item.day}-${item.startTime}`}
                            className="
                                grid grid-cols-1 gap-3
                                py-4
                                sm:grid-cols-[8rem_7rem_1fr_auto]
                                sm:items-center
                            "
                        >
                            <div className="border-l-4 border-[#35822E] pl-3">
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#35822E]">
                                    <Clock3 className="h-4 w-4" />

                                    <span>
                                        {item.startTime}
                                        –
                                        {item.endTime}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm font-semibold text-neutral-900">
                                {item.courseCode}
                            </p>

                            <div>
                                <p className="text-sm text-neutral-700">
                                    {item.courseName}
                                </p>

                                <p className="mt-1 text-xs text-neutral-400">
                                    Section {item.sectionCode}
                                </p>
                            </div>

                            <StatusBadge variant="primary">
                                <MapPin className="mr-1 h-3.5 w-3.5" />

                                {item.room}
                            </StatusBadge>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}