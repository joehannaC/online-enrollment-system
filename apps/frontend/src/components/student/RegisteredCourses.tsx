import {
    BookOpenCheck,
} from "lucide-react";

import {
    DataTable,
    type DataTableColumn,
} from "@/components/common";

import type {
    RegisteredCourse,
} from "@/types";

interface RegisteredCoursesProps {
    courses:
        RegisteredCourse[];

    isLoading?:
        boolean;

    showSchedule?:
        boolean;
}

function formatUnitTotal(
    academicUnits: number,
    nonAcademicUnits: number,
): string {
    return nonAcademicUnits >
        0
        ? `${academicUnits}(${nonAcademicUnits})`
        : String(
              academicUnits,
          );
}

function formatSchedule(
    course: RegisteredCourse,
): string {
    if (
        course.schedule.length ===
        0
    ) {
        return "No schedule";
    }

    return course.schedule
        .map((item) => {
            const days =
                item.days.length >
                0
                    ? item.days.join(
                          "/",
                      )
                    : "TBA";

            const time =
                item.startTime &&
                item.endTime
                    ? `${item.startTime}–${item.endTime}`
                    : "Time TBA";

            const room =
                item.room
                    ? ` • ${item.room}`
                    : "";

            return `${days} ${time}${room}`;
        })
        .join(", ");
}

export default function RegisteredCourses({
    courses,
    isLoading = false,
    showSchedule = false,
}: RegisteredCoursesProps) {
    const totalAcademicUnits =
        courses.reduce(
            (
                total,
                course,
            ) =>
                total +
                Number(
                    course.units ??
                        0,
                ),
            0,
        );

    const totalNonAcademicUnits =
        courses.reduce(
            (
                total,
                course,
            ) =>
                total +
                Number(
                    course.nonAcademicUnits ??
                        0,
                ),
            0,
        );

    const shouldScroll =
        courses.length > 2;

    const columns:
        DataTableColumn<
            RegisteredCourse
        >[] = [
        {
            key:
                "course",

            header:
                "Course",

            render:
                (course) => (
                    <div>
                        <p className="font-medium text-neutral-900">
                            {
                                course.courseName
                            }
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                            Section{" "}
                            {
                                course.sectionCode
                            }
                        </p>
                    </div>
                ),
        },

        {
            key:
                "code",

            header:
                "Code",

            render:
                (course) =>
                    course.courseCode,
        },

        ...(showSchedule
            ? [
                  {
                      key:
                          "schedule",

                      header:
                          "Schedule",

                      render:
                          (
                              course:
                                  RegisteredCourse,
                          ) =>
                              formatSchedule(
                                  course,
                              ),
                  },
              ]
            : []),

        {
            key:
                "units",

            header:
                "Units",

            render:
                (course) =>
                    formatUnitTotal(
                        Number(
                            course.units ??
                                0,
                        ),

                        Number(
                            course.nonAcademicUnits ??
                                0,
                        ),
                    ),

            className:
                "text-center",

            headerClassName:
                "text-center",
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
                    {courses.length}{" "}
                    {courses.length ===
                    1
                        ? "course"
                        : "courses"}{" "}
                    •{" "}
                    {formatUnitTotal(
                        totalAcademicUnits,
                        totalNonAcademicUnits,
                    )}{" "}
                    units
                </p>
            </header>

            <div
                className={
                    shouldScroll
                        ? "max-h-[240px] overflow-y-auto overflow-x-hidden"
                        : "overflow-hidden"
                }
            >
                <DataTable
                    columns={
                        columns
                    }
                    data={
                        courses
                    }
                    isLoading={
                        isLoading
                    }
                    getRowKey={(
                        course,
                    ) =>
                        course.enrollmentId
                    }
                    emptyTitle="No registered courses"
                    emptyDescription="Your registered or enrolled courses for the academic term will appear here."
                    className="rounded-none border-0 shadow-none"
                    tableClassName="rounded-none"
                />
            </div>
        </section>
    );
}