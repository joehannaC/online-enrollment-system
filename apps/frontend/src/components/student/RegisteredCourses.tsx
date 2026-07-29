import { BookOpenCheck } from "lucide-react";

import {
    DataTable,
    StatusBadge,
    type DataTableColumn,
} from "@/components/common";
import type { RegisteredCourse } from "@/types";

interface RegisteredCoursesProps {
    courses: RegisteredCourse[];
    isLoading?: boolean;
    showSchedule?: boolean;
}

function formatSchedule(
    course: RegisteredCourse,
): string {
    if (course.schedule.length === 0) {
        return "No schedule";
    }

    return course.schedule
        .map(
            (item) =>
                `${item.days.join("/")} ${item.startTime}–${item.endTime}`,
        )
        .join(", ");
}

export default function RegisteredCourses({
    courses,
    isLoading = false,
    showSchedule = false,
}: RegisteredCoursesProps) {
    const totalUnits = courses.reduce(
        (sum, course) => sum + course.units,
        0,
    );

    const columns: DataTableColumn<RegisteredCourse>[] =
        [
            {
                key: "course",
                header: "Course",
                render: (course) => (
                    <div>
                        <p className="font-medium text-neutral-900">
                            {course.courseName}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                            Section{" "}
                            {course.sectionCode}
                        </p>
                    </div>
                ),
            },
            {
                key: "code",
                header: "Code",
                render: (course) =>
                    course.courseCode,
            },
            ...(showSchedule
                ? [
                        {
                            key: "schedule",
                            header: "Schedule",
                            render: (
                                course: RegisteredCourse,
                            ) =>
                                formatSchedule(course),
                        },
                ]
                : []),
            {
                key: "units",
                header: "Units",
                render: (course) =>
                    course.units,
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "status",
                header: "Status",
                render: (course) => (
                    <StatusBadge
                        variant={
                            course.enrollmentStatus ===
                            "ENROLLED"
                                ? "success"
                                : "warning"
                        }
                    >
                        {
                            course.enrollmentStatus
                        }
                    </StatusBadge>
                ),
                className: "text-center",
                headerClassName: "text-center",
            },
        ];

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="flex flex-col gap-2 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5 text-[#35822E]" />

                    <h2 className="text-lg font-semibold text-[#35822E]">
                        Registered Courses
                    </h2>
                </div>

                <p className="text-xs text-neutral-500">
                    {courses.length} courses •{" "}
                    {totalUnits} units
                </p>
            </header>

            <div className="overflow-hidden">
                <DataTable
                    columns={columns}
                    data={courses}
                    isLoading={isLoading}
                    getRowKey={(course) =>
                        course.enrollmentId
                    }
                    emptyTitle="No registered courses"
                    emptyDescription="Your enrolled courses for the current term will appear here."
                    className="rounded-none border-0 shadow-none"
                    tableClassName="rounded-none"
                />
            </div>
        </section>
    );
}