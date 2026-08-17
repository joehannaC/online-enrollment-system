"use client";

import {
    BookOpenCheck,
    FileClock,
    RefreshCw,
    Search,
    UserRoundCheck,
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
    getFacultyRecords,
} from "@/lib/api/facultyApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import type {
    FacultyRecordItem,
    FacultyRecordStatus,
    FacultyRecordsResponse,
} from "@/types";

function formatDate(
    value?: string,
): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-PH",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone:
                "Asia/Manila",
        },
    ).format(date);
}

function formatGrade(
    value:
        | number
        | null
        | undefined,
): string {
    return typeof value === "number" &&
        Number.isFinite(value)
        ? value.toFixed(1)
        : "—";
}

function getStatusVariant(
    status: FacultyRecordStatus,
):
    | "success"
    | "warning"
    | "neutral" {
    switch (status) {
        case "SUBMITTED":
            return "success";
        case "DRAFT":
            return "warning";
        default:
            return "neutral";
    }
}

export default function FacultyRecordsPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<FacultyRecordsResponse | null>(
            null,
        );

    const [
        selectedRecord,
        setSelectedRecord,
    ] =
        useState<FacultyRecordItem | null>(
            null,
        );

    const [
        searchQuery,
        setSearchQuery,
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

    const loadRecords =
        useCallback(
            async (
                signal?: AbortSignal,
            ): Promise<void> => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const response =
                        await getFacultyRecords(
                            signal,
                        );

                    setData(response);
                } catch (error) {
                    if (
                        error instanceof DOMException &&
                        error.name ===
                            "AbortError"
                    ) {
                        return;
                    }

                    if (
                        error instanceof
                            FacultyApiError &&
                        error.status === 401
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
                        error.status === 403
                    ) {
                        router.replace(
                            "/student/dashboard",
                        );
                        return;
                    }

                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Faculty grade records could not be loaded.",
                    );
                } finally {
                    if (!signal?.aborted) {
                        setIsLoading(false);
                    }
                }
            },
            [router],
        );

    useEffect(() => {
        const controller =
            new AbortController();

        void loadRecords(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [loadRecords]);

    useEffect(() => {
        function refresh(): void {
            void loadRecords();
        }

        function handleVisibility(): void {
            if (
                document.visibilityState ===
                "visible"
            ) {
                refresh();
            }
        }

        window.addEventListener(
            "focus",
            refresh,
        );
        document.addEventListener(
            "visibilitychange",
            handleVisibility,
        );

        return () => {
            window.removeEventListener(
                "focus",
                refresh,
            );
            document.removeEventListener(
                "visibilitychange",
                handleVisibility,
            );
        };
    }, [loadRecords]);

    const filteredRecords =
        useMemo(() => {
            const normalizedQuery =
                searchQuery
                    .trim()
                    .toLowerCase();

            return (
                data?.records.filter(
                    (record) => {
                        const matchesSearch =
                            normalizedQuery.length ===
                                0 ||
                            record.courseName
                                .toLowerCase()
                                .includes(
                                    normalizedQuery,
                                ) ||
                            record.courseCode
                                .toLowerCase()
                                .includes(
                                    normalizedQuery,
                                ) ||
                            record.sectionCode
                                .toLowerCase()
                                .includes(
                                    normalizedQuery,
                                );

                        const matchesStatus =
                            statusFilter ===
                                "ALL" ||
                            record.status ===
                                statusFilter;

                        return (
                            matchesSearch &&
                            matchesStatus
                        );
                    },
                ) ?? []
            );
        }, [
            data,
            searchQuery,
            statusFilter,
        ]);

    if (
        errorMessage &&
        !data
    ) {
        return (
            <ServiceUnavailable
                serviceName="Grade Service"
                title="Faculty records unavailable"
                description={
                    errorMessage
                }
                onRetry={() => {
                    void loadRecords();
                }}
            />
        );
    }

    return (
        <PageContainer>
            <div className="space-y-5">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-serif text-3xl font-semibold text-[#35822E] sm:text-4xl">
                            Grade Records
                        </h1>

                        <p className="mt-1 text-sm text-neutral-600">
                            Review submitted grades and continue unfinished grade entries.
                        </p>
                    </div>

                    {errorMessage ? (
                        <Button
                            size="sm"
                            variant="outline"
                            leftIcon={
                                RefreshCw
                            }
                            onClick={() => {
                                void loadRecords();
                            }}
                        >
                            Refresh
                        </Button>
                    ) : null}
                </header>

                {isLoading ||
                !data ? (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({
                            length: 4,
                        }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                                >
                                    <LoadingSkeleton className="h-4 w-32" />
                                    <LoadingSkeleton className="mt-4 h-8 w-20" />
                                </div>
                            ),
                        )}
                    </section>
                ) : (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                            <BookOpenCheck className="h-5 w-5 text-[#35822E]" />
                            <p className="mt-3 text-sm text-neutral-500">
                                Submitted Classes
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-[#35822E]">
                                {
                                    data.summary
                                        .submittedClasses
                                }
                            </p>
                        </article>

                        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                            <UserRoundCheck className="h-5 w-5 text-[#35822E]" />
                            <p className="mt-3 text-sm text-neutral-500">
                                Student Records
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-[#35822E]">
                                {
                                    data.summary
                                        .studentRecords
                                }
                            </p>
                        </article>

                        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                            <FileClock className="h-5 w-5 text-amber-600" />
                            <p className="mt-3 text-sm text-neutral-500">
                                Drafts
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-amber-700">
                                {
                                    data.summary
                                        .drafts
                                }
                            </p>
                        </article>

                        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                            <FileClock className="h-5 w-5 text-neutral-500" />
                            <p className="mt-3 text-sm text-neutral-500">
                                Incomplete
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-neutral-700">
                                {
                                    data.summary
                                        .incomplete
                                }
                            </p>
                        </article>
                    </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                    <header className="border-b border-neutral-200 px-5 py-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#35822E]">
                                    Submission History
                                </h2>

                                {data ? (
                                    <p className="mt-1 text-sm text-neutral-500">
                                        Term {data.term.termNumber} • A.Y. {data.term.academicYear}
                                    </p>
                                ) : null}
                            </div>

                            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(230px,1fr)_170px] xl:w-auto">
                                <Input
                                    name="recordSearch"
                                    value={
                                        searchQuery
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setSearchQuery(
                                            event
                                                .target
                                                .value,
                                        );
                                    }}
                                    placeholder="Search subject or section"
                                    leftIcon={
                                        Search
                                    }
                                />

                                <Select
                                    name="recordStatus"
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
                                                "All statuses",
                                            value:
                                                "ALL",
                                        },
                                        {
                                            label:
                                                "Submitted",
                                            value:
                                                "SUBMITTED",
                                        },
                                        {
                                            label:
                                                "Draft",
                                            value:
                                                "DRAFT",
                                        },
                                        {
                                            label:
                                                "Incomplete",
                                            value:
                                                "INCOMPLETE",
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="p-5">
                            <LoadingSkeleton className="h-72 w-full" />
                        </div>
                    ) : filteredRecords.length ===
                    0 ? (
                        <div className="p-5">
                            <EmptyState
                                compact
                                icon={
                                    BookOpenCheck
                                }
                                title="No grade records"
                                description="No records match the selected search or status filter."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[920px] border-collapse text-sm">
                                <thead className="bg-[#35822E]/35 text-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Subject
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Section
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Last Update
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Students
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredRecords.map(
                                        (record) => (
                                            <tr
                                                key={
                                                    record.sectionId
                                                }
                                                className="border-b border-neutral-200 last:border-b-0"
                                            >
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-neutral-900">
                                                        {
                                                            record.courseName
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {
                                                            record.courseCode
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 text-center text-neutral-700">
                                                    {
                                                        record.sectionCode
                                                    }
                                                </td>

                                                <td className="px-4 py-4 text-center text-neutral-700">
                                                    {record.status ===
                                                    "SUBMITTED"
                                                        ? formatDate(
                                                            record.submittedAt,
                                                        )
                                                        : record.lastSavedAt
                                                        ? `${formatDate(
                                                                record.lastSavedAt,
                                                            )}`
                                                        : "No grade input"}
                                                </td>

                                                <td className="px-4 py-4 text-center font-semibold text-neutral-800">
                                                    {
                                                        record.submittedStudents
                                                    }{" "}
                                                    /{" "}
                                                    {
                                                        record.enrolledStudents
                                                    }
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <StatusBadge
                                                        variant={
                                                            getStatusVariant(
                                                                record.status,
                                                            )
                                                        }
                                                    >
                                                        {record.status ===
                                                        "SUBMITTED"
                                                            ? "Submitted"
                                                            : record.status ===
                                                                "DRAFT"
                                                            ? "Draft"
                                                            : "Incomplete"}
                                                    </StatusBadge>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {record.status ===
                                                    "SUBMITTED" ? (
                                                        <Button
                                                            size="sm"
                                                            className="min-w-[110px]"
                                                            onClick={() => {
                                                                setSelectedRecord(
                                                                    record,
                                                                );
                                                            }}
                                                        >
                                                            View Grades
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="min-w-[110px]"
                                                            onClick={() => {
                                                                router.push(
                                                                    `/faculty/grade-entry?sectionId=${encodeURIComponent(
                                                                        record.sectionId,
                                                                    )}`,
                                                                );
                                                            }}
                                                        >
                                                            Continue
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {selectedRecord ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="faculty-record-grade-summary"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    onClick={() => {
                        setSelectedRecord(
                            null,
                        );
                    }}
                >
                    <section
                        className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => {
                            event.stopPropagation();
                        }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                            <div>
                                <h2
                                    id="faculty-record-grade-summary"
                                    className="text-xl font-semibold text-[#35822E]"
                                >
                                    Grade Summary
                                </h2>

                                <p className="mt-1 text-sm text-neutral-600">
                                    {selectedRecord.courseCode} • {selectedRecord.sectionCode} — {selectedRecord.courseName}
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close grade summary"
                                onClick={() => {
                                    setSelectedRecord(
                                        null,
                                    );
                                }}
                                className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="max-h-[65vh] overflow-auto">
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead className="sticky top-0 bg-neutral-100 text-neutral-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Activity
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            MO 1
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            MO 2
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Midterm
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Final Exam
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Final Grade
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedRecord.students.map(
                                        (student) => (
                                            <tr
                                                key={
                                                    student.studentId
                                                }
                                                className="border-b border-neutral-200 last:border-b-0"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-neutral-900">
                                                        {
                                                            student.fullName
                                                        }
                                                    </p>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {
                                                            student.studentNumber
                                                        }
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-900">
                                                    {formatGrade(
                                                        student.activity,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-900">
                                                    {formatGrade(
                                                        student.majorOutput1,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-900">
                                                    {formatGrade(
                                                        student.majorOutput2,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-900">
                                                    {formatGrade(
                                                        student.midtermExam,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-900">
                                                    {formatGrade(
                                                        student.finalExam,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold text-[#35822E]">
                                                    {formatGrade(
                                                        student.finalGradeValue,
                                                    )}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            ) : null}
        </PageContainer>
    );
}
