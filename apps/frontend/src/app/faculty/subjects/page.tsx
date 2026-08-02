"use client";

import {
    BookOpen,
    CalendarDays,
    DoorOpen,
    Search,
    Users,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import {
    Button,
    EmptyState,
    Input,
    LoadingSkeleton,
    Select,
    ServiceUnavailable,
    StatusBadge,
} from "@/components/common";
import {
    PageContainer,
} from "@/components/layout";
import {
    FacultyApiError,
    getFacultySubjects,
} from "@/lib/api/facultyApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import type {
    FacultySubjectListItem,
    FacultySubjectsPageResponse,
} from "@/types";

function formatSchedule(
    subject: FacultySubjectListItem,
): string {
    if (
        subject.schedule.length ===
        0
    ) {
        return "No schedule assigned";
    }

    return subject.schedule
        .map(
            (item) =>
                `${item.days.join("/")} • ${item.startTime}–${item.endTime}`,
        )
        .join(", ");
}

function formatRooms(
    subject: FacultySubjectListItem,
): string {
    if (
        subject.schedule.length ===
        0
    ) {
        return "TBA";
    }

    return subject.schedule
        .map(
            (item) =>
                item.room,
        )
        .join(", ");
}

function formatFinalGrade(
    value: number | null,
): string {
    return value === null
        ? "Pending"
        : value.toFixed(1);
}

export default function FacultySubjectsPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<FacultySubjectsPageResponse | null>(
            null,
        );

    const [
        selectedSubject,
        setSelectedSubject,
    ] =
        useState<FacultySubjectListItem | null>(
            null,
        );

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const loadSubjects =
        useCallback(
            async (
                signal?: AbortSignal,
            ): Promise<void> => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const response =
                        await getFacultySubjects(
                            signal,
                        );

                    setData(
                        response,
                    );
                } catch (error) {
                    if (
                        error instanceof
                            DOMException &&
                        error.name ===
                            "AbortError"
                    ) {
                        return;
                    }

                    if (
                        error instanceof
                            FacultyApiError &&
                        error.status ===
                            401
                    ) {
                        clearAuthSession();
                        router.replace(
                            "/login",
                        );
                        return;
                    }

                    if (
                        error instanceof
                            FacultyApiError &&
                        error.status ===
                            403
                    ) {
                        router.replace(
                            "/student/dashboard",
                        );
                        return;
                    }

                    setErrorMessage(
                        error instanceof
                            Error
                            ? error.message
                            : "The faculty subjects could not be loaded.",
                    );
                } finally {
                    if (
                        !signal?.aborted
                    ) {
                        setIsLoading(
                            false,
                        );
                    }
                }
            },
            [
                router,
            ],
        );

    useEffect(() => {
        const controller =
            new AbortController();

        void loadSubjects(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [
        loadSubjects,
    ]);

    const filteredSubjects =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            return (
                data?.subjects.filter(
                    (subject) => {
                        const matchesSearch =
                            query.length ===
                                0 ||
                            subject.courseName
                                .toLowerCase()
                                .includes(
                                    query,
                                ) ||
                            subject.courseCode
                                .toLowerCase()
                                .includes(
                                    query,
                                ) ||
                            subject.sectionCode
                                .toLowerCase()
                                .includes(
                                    query,
                                );

                        const isComplete =
                            subject.pendingGrades ===
                            0;

                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||
                            (statusFilter ===
                                "COMPLETE" &&
                                isComplete) ||
                            (statusFilter ===
                                "PENDING" &&
                                !isComplete);

                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    },
                ) ?? []
            );
        }, [
            data,
            search,
            statusFilter,
        ]);

    if (
        errorMessage &&
        !data
    ) {
        return (
            <ServiceUnavailable
                serviceName="Grade Service"
                title="Faculty subjects unavailable"
                description={
                    errorMessage
                }
                onRetry={() => {
                    void loadSubjects();
                }}
            />
        );
    }

    const shouldScroll =
        filteredSubjects.length >
        8;

    return (
        <PageContainer>
            <div className="space-y-5">
                <header>
                    <h1 className="font-serif text-3xl font-semibold text-[#35822E] sm:text-4xl">
                        Subjects
                    </h1>

                    <p className="mt-1 text-sm text-neutral-600">
                        View your assigned classes, schedules, enrollment, and grading progress.
                    </p>
                </header>

                {isLoading ||
                !data ? (
                    <section className="rounded-xl border border-[#35822E]/50 bg-white p-5 shadow-sm">
                        <LoadingSkeleton className="h-5 w-52" />
                        <div className="mt-4 flex gap-8">
                            <LoadingSkeleton className="h-4 w-32" />
                            <LoadingSkeleton className="h-4 w-36" />
                        </div>
                    </section>
                ) : (
                    <section className="rounded-xl border border-[#35822E]/50 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="font-semibold text-neutral-900">
                                    Term{" "}
                                    {
                                        data.term
                                            .termNumber
                                    }{" "}
                                    • A.Y.{" "}
                                    {
                                        data.term
                                            .academicYear
                                    }
                                </h2>

                                <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-600">
                                    <p>
                                        {
                                            data.summary
                                                .handledSubjectCount
                                        }{" "}
                                        handled sections
                                    </p>

                                    <p>
                                        {
                                            data.summary
                                                .enrolledStudentCount
                                        }{" "}
                                        enrolled students
                                    </p>
                                </div>
                            </div>

                            <StatusBadge variant="primary">
                                Current Term
                            </StatusBadge>
                        </div>
                    </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <header className="border-b border-neutral-200 px-5 py-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#35822E]">
                                    My Handled Subjects
                                </h2>

                                <p className="mt-1 text-sm text-neutral-500">
                                    Every section with at least one successfully enrolled student is listed separately.
                                </p>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(230px,1fr)_170px] xl:w-auto">
                                <Input
                                    name="subjectSearch"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setSearch(
                                            event
                                                .target
                                                .value,
                                        );
                                    }}
                                    leftIcon={
                                        Search
                                    }
                                    placeholder="Search subject, code, or section"
                                />

                                <Select
                                    name="subjectStatus"
                                    value={
                                        statusFilter
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setStatusFilter(
                                            event
                                                .target
                                                .value,
                                        );
                                    }}
                                    options={[
                                        {
                                            label:
                                                "All subjects",
                                            value:
                                                "ALL",
                                        },
                                        {
                                            label:
                                                "Complete",
                                            value:
                                                "COMPLETE",
                                        },
                                        {
                                            label:
                                                "Pending",
                                            value:
                                                "PENDING",
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                            {Array.from({
                                length: 4,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="h-56 animate-pulse rounded-2xl bg-neutral-100"
                                    />
                                ),
                            )}
                        </div>
                    ) : filteredSubjects.length ===
                      0 ? (
                        <div className="p-5">
                            <EmptyState
                                compact
                                icon={
                                    BookOpen
                                }
                                title="No handled subjects"
                                description="No sections match the selected search or grading filter."
                            />
                        </div>
                    ) : (
                        <div
                            className={[
                                "grid grid-cols-1 gap-4 p-5 xl:grid-cols-2",
                                shouldScroll
                                    ? "max-h-[760px] overflow-y-auto overscroll-contain pr-3"
                                    : "",
                            ].join(
                                " ",
                            )}
                        >
                            {filteredSubjects.map(
                                (
                                    subject,
                                ) => {
                                    const isComplete =
                                        subject.pendingGrades ===
                                        0;

                                    return (
                                        <article
                                            key={
                                                subject.sectionId
                                            }
                                            className="rounded-2xl border border-neutral-200 border-l-4 border-l-[#35822E] bg-white p-5 shadow-sm transition hover:shadow-md"
                                        >
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#35822E]">
                                                    {
                                                        subject.courseName
                                                    }
                                                </h3>

                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {
                                                        subject.courseCode
                                                    }{" "}
                                                    • Section{" "}
                                                    {
                                                        subject.sectionCode
                                                    }
                                                </p>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="flex items-start gap-2 text-sm text-neutral-600">
                                                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                                                    <div>
                                                        <p className="text-xs font-medium text-neutral-500">
                                                            Schedule
                                                        </p>
                                                        <p className="mt-1">
                                                            {formatSchedule(
                                                                subject,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2 text-sm text-neutral-600">
                                                    <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                                                    <div>
                                                        <p className="text-xs font-medium text-neutral-500">
                                                            Room
                                                        </p>
                                                        <p className="mt-1">
                                                            {formatRooms(
                                                                subject,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                                    <Users className="h-4 w-4 text-[#35822E]" />
                                                    <span>
                                                        {
                                                            subject.enrolledStudents
                                                        }{" "}
                                                        students
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <StatusBadge
                                                        variant={
                                                            isComplete
                                                                ? "success"
                                                                : "warning"
                                                        }
                                                    >
                                                        {
                                                            subject.gradedStudents
                                                        }{" "}
                                                        /{" "}
                                                        {
                                                            subject.enrolledStudents
                                                        }{" "}
                                                        graded
                                                    </StatusBadge>

                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedSubject(
                                                                subject,
                                                            );
                                                        }}
                                                    >
                                                        View Class
                                                    </Button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    )}
                </section>
            </div>

            {selectedSubject ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="class-roster-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    onClick={() => {
                        setSelectedSubject(
                            null,
                        );
                    }}
                >
                    <section
                        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(
                            event,
                        ) => {
                            event.stopPropagation();
                        }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                            <div>
                                <h2
                                    id="class-roster-title"
                                    className="text-xl font-semibold text-[#35822E]"
                                >
                                    Class List
                                </h2>

                                <p className="mt-1 text-sm text-neutral-600">
                                    {
                                        selectedSubject.courseCode
                                    }{" "}
                                    • Section{" "}
                                    {
                                        selectedSubject.sectionCode
                                    }{" "}
                                    —{" "}
                                    {
                                        selectedSubject.courseName
                                    }
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                    {
                                        selectedSubject.enrolledStudents
                                    }{" "}
                                    enrolled students
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close class list"
                                onClick={() => {
                                    setSelectedSubject(
                                        null,
                                    );
                                }}
                                className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="max-h-[65vh] overflow-auto">
                            <table className="w-full min-w-[620px] border-collapse text-sm">
                                <thead className="sticky top-0 bg-neutral-100 text-neutral-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Student Number
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Grade Status
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Final Grade
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedSubject.students.map(
                                        (
                                            student,
                                        ) => (
                                            <tr
                                                key={
                                                    student.studentId
                                                }
                                                className="border-b border-neutral-200 last:border-b-0"
                                            >
                                                <td className="px-4 py-3 font-medium text-neutral-900">
                                                    {
                                                        student.fullName
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center text-neutral-700">
                                                    {
                                                        student.studentNumber
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge
                                                        variant={
                                                            student.gradeStatus ===
                                                            "VERIFIED"
                                                                ? "success"
                                                                : student.gradeStatus ===
                                                                    "RETURNED"
                                                                  ? "danger"
                                                                  : student.gradeStatus ===
                                                                      "SUBMITTED"
                                                                    ? "primary"
                                                                    : "warning"
                                                        }
                                                    >
                                                        {
                                                            student.gradeStatus
                                                        }
                                                    </StatusBadge>
                                                </td>

                                                <td className="px-4 py-3 text-center font-semibold text-[#35822E]">
                                                    {formatFinalGrade(
                                                        student.finalGradeValue,
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <footer className="flex justify-end border-t border-neutral-200 px-5 py-4">
                            <Button
                                onClick={() => {
                                    router.push(
                                        `/faculty/grade-entry?sectionId=${selectedSubject.sectionId}`,
                                    );
                                }}
                            >
                                Open Grade Entry
                            </Button>
                        </footer>
                    </section>
                </div>
            ) : null}
        </PageContainer>
    );
}
