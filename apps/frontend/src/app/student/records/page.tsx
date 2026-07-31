"use client";

import {
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    Info,
    Search,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    LoadingSkeleton,
    ServiceUnavailable,
} from "@/components/common";
import PageContainer from "@/components/layout/PageContainer";
import {
    getStudentRecords,
    StudentRecordApiError,
} from "@/lib/api/studentRecordApi";
import type {
    StudentRecordItem,
    StudentRecordResponse,
    StudentRecordStatus,
} from "@/types";

const recordStatusLabels: Record<
    StudentRecordStatus,
    string
> = {
    IN_PROGRESS:
        "In Progress",

    COMPLETED:
        "Completed",

    CANNOT_YET_BE_ENLISTED:
        "Cannot Yet Be Enlisted",

    REGISTERED:
        "Registered",

    CAN_BE_ENLISTED:
        "Can Be Enlisted",

    CREDITED:
        "Credited",
};

const selectableStatuses =
    Object.entries(
        recordStatusLabels,
    ) as [
        StudentRecordStatus,
        string,
    ][];

function getStatusLabel(
    record: StudentRecordItem,
): string {
    switch (
        record.eligibilityCode
    ) {
        case "ELIGIBLE":
            return "Eligible";

        case "MISSING_PREREQUISITES":
            return "Cannot yet be enlisted";

        case "ALREADY_COMPLETED":
            return "Completed";

        case "ALREADY_SELECTED":
            return "Selected";

        case "SECTION_FULL":
            return "Full";

        case "MAXIMUM_LOAD_EXCEEDED":
            return "Load exceeded";

        case "ENROLLMENT_NOT_OPEN":
            return "Not yet open";

        case "ENROLLMENT_CLOSED":
            return "Closed";

        case "ENROLLMENT_SUBMITTED":
            return "Submitted";

        case "FAILED_COURSE_RETAKE_NOT_ALLOWED":
            return "Retake unavailable";

        case "SCHEDULE_CONFLICT":
            return "Conflict";

        default:
            return "Status";
    }
}

function getStatusClassName(
    record: StudentRecordItem,
): string {
    switch (
        record.eligibilityCode
    ) {
        case "ELIGIBLE":
            return [
                "border-green-300",
                "bg-green-50",
                "text-green-700",
                "hover:bg-green-100",
            ].join(" ");

        case "ALREADY_COMPLETED":
        case "ALREADY_SELECTED":
            return [
                "border-blue-300",
                "bg-blue-50",
                "text-blue-700",
                "hover:bg-blue-100",
            ].join(" ");

        case "SECTION_FULL":
        case "ENROLLMENT_CLOSED":
        case "ENROLLMENT_SUBMITTED":
            return [
                "border-red-300",
                "bg-red-50",
                "text-red-700",
                "hover:bg-red-100",
            ].join(" ");

        default:
            return [
                "border-amber-300",
                "bg-amber-50",
                "text-amber-700",
                "hover:bg-amber-100",
            ].join(" ");
    }
}

function getStatusIconClassName(
    record: StudentRecordItem,
): string {
    switch (
        record.eligibilityCode
    ) {
        case "ELIGIBLE":
        case "ALREADY_COMPLETED":
            return "bg-green-100 text-green-700";

        case "ALREADY_SELECTED":
            return "bg-blue-100 text-blue-700";

        case "SECTION_FULL":
        case "ENROLLMENT_CLOSED":
        case "ENROLLMENT_SUBMITTED":
            return "bg-red-100 text-red-700";

        default:
            return "bg-amber-100 text-amber-700";
    }
}

function usesPositiveStatusIcon(
    record: StudentRecordItem,
): boolean {
    return (
        record.eligibilityCode ===
            "ELIGIBLE" ||
        record.eligibilityCode ===
            "ALREADY_COMPLETED"
    );
}

function StatusBadge({
    record,
    onClick,
}: {
    record: StudentRecordItem;

    onClick: (
        record: StudentRecordItem,
    ) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => {
                onClick(record);
            }}
            className={[
                `
                    inline-flex
                    max-w-full
                    items-center
                    justify-center
                    gap-1.5
                    rounded-full
                    border px-3 py-1
                    text-center
                    text-xs font-medium
                    transition
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#35822E]/30
                `,
                getStatusClassName(
                    record,
                ),
            ].join(" ")}
        >
            <Info
                aria-hidden="true"
                className="h-3.5 w-3.5"
            />

            {getStatusLabel(
                record,
            )}
        </button>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <article
            className="
                flex min-h-[104px] flex-col
                items-center justify-center
                rounded-xl border
                border-[#35822E]/35
                bg-white px-3 py-4
                text-center shadow-sm
                sm:min-h-[112px]
                sm:px-5
            "
        >
            <p
                className="
                    text-xs font-medium
                    text-neutral-600
                    sm:text-sm
                "
            >
                {label}
            </p>

            <p
                className="
                    mt-1 text-2xl
                    font-bold text-[#35822E]
                    sm:text-3xl
                "
            >
                {value}
            </p>
        </article>
    );
}

function DesktopRecordRow({
    record,
    onStatusClick,
}: {
    record: StudentRecordItem;

    onStatusClick: (
        record: StudentRecordItem,
    ) => void;
}) {
    return (
        <tr
            className="
                border-b border-neutral-200
                transition hover:bg-neutral-50
                last:border-b-0
            "
        >
            <td className="px-5 py-4">
                <p
                    className="
                        font-medium
                        text-neutral-900
                    "
                >
                    {record.courseName}
                </p>

                {record
                    .missingPrerequisiteCodes
                    .length > 0 ? (
                    <p
                        className="
                            mt-1 text-xs
                            text-neutral-500
                        "
                    >
                        Missing prerequisites:{" "}
                        {record.missingPrerequisiteCodes.join(
                            ", ",
                        )}
                    </p>
                ) : null}
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-5 py-4
                    text-center
                    font-medium
                    text-neutral-800
                "
            >
                {record.courseCode}
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-5 py-4
                    text-center
                    font-semibold
                    text-neutral-800
                "
            >
                {record.units}
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-5 py-4
                    text-center
                    font-medium
                    text-neutral-800
                "
            >
                {record.academicYear}
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-5 py-4
                    text-center
                    font-medium
                    text-neutral-800
                "
            >
                {record.academicTerm > 0
                    ? `Term ${record.academicTerm}`
                    : "—"}
            </td>

            <td className="px-5 py-4 text-center">
                <StatusBadge
                    record={record}
                    onClick={
                        onStatusClick
                    }
                />
            </td>
        </tr>
    );
}

function MobileRecordCard({
    record,
    onStatusClick,
}: {
    record: StudentRecordItem;

    onStatusClick: (
        record: StudentRecordItem,
    ) => void;
}) {
    return (
        <article
            className="
                rounded-xl border
                border-neutral-200
                bg-white p-4 shadow-sm
            "
        >
            <div
                className="
                    flex flex-col gap-3
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                "
            >
                <div className="min-w-0">
                    <p
                        className="
                            break-words font-semibold
                            text-neutral-900
                        "
                    >
                        {record.courseName}
                    </p>

                    <p
                        className="
                            mt-1 text-sm font-medium
                            text-[#35822E]
                        "
                    >
                        {record.courseCode}
                    </p>
                </div>

                <div className="shrink-0">
                    <StatusBadge
                        record={record}
                        onClick={
                            onStatusClick
                        }
                    />
                </div>
            </div>

            <dl
                className="
                    mt-4 grid grid-cols-3
                    gap-2 border-t
                    border-neutral-100 pt-4
                    text-center
                "
            >
                <div>
                    <dt
                        className="
                            text-[11px]
                            text-neutral-500
                        "
                    >
                        Units
                    </dt>

                    <dd
                        className="
                            mt-1 text-sm
                            font-semibold
                            text-neutral-800
                        "
                    >
                        {record.units}
                    </dd>
                </div>

                <div>
                    <dt
                        className="
                            text-[11px]
                            text-neutral-500
                        "
                    >
                        Academic Year
                    </dt>

                    <dd
                        className="
                            mt-1 text-sm
                            font-semibold
                            text-neutral-800
                        "
                    >
                        {record.academicYear}
                    </dd>
                </div>

                <div>
                    <dt
                        className="
                            text-[11px]
                            text-neutral-500
                        "
                    >
                        Term
                    </dt>

                    <dd
                        className="
                            mt-1 text-sm
                            font-semibold
                            text-neutral-800
                        "
                    >
                        {record.academicTerm > 0
                            ? record.academicTerm
                            : "—"}
                    </dd>
                </div>
            </dl>

            {record
                .missingPrerequisiteCodes
                .length > 0 ? (
                <p
                    className="
                        mt-4 rounded-lg
                        bg-neutral-50 px-3 py-2
                        text-xs text-neutral-600
                    "
                >
                    Missing prerequisites:{" "}
                    {record.missingPrerequisiteCodes.join(
                        ", ",
                    )}
                </p>
            ) : null}
        </article>
    );
}

export default function StudentRecordsPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<StudentRecordResponse | null>(
            null,
        );

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        appliedSearch,
        setAppliedSearch,
    ] = useState("");

    const [
        selectedPeriod,
        setSelectedPeriod,
    ] = useState("");

    const [
        status,
        setStatus,
    ] =
        useState<
            StudentRecordStatus | ""
        >("");

    const [
        page,
        setPage,
    ] = useState(1);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        retryKey,
        setRetryKey,
    ] = useState(0);

    const [
        statusNotification,
        setStatusNotification,
    ] =
        useState<StudentRecordItem | null>(
            null,
        );

    useEffect(() => {
        const timeout =
            window.setTimeout(() => {
                setAppliedSearch(
                    search.trim(),
                );

                setPage(1);
            }, 300);

        return () => {
            window.clearTimeout(
                timeout,
            );
        };
    }, [search]);

    const selectedAcademicPeriod =
        useMemo(() => {
            if (!selectedPeriod) {
                return {
                    academicYear:
                        undefined,

                    termNumber:
                        undefined,
                };
            }

            const [
                academicYear,
                termValue,
            ] =
                selectedPeriod.split(
                    "|",
                );

            const parsedTerm =
                Number(termValue);

            return {
                academicYear:
                    academicYear ||
                    undefined,

                termNumber:
                    Number.isInteger(
                        parsedTerm,
                    )
                        ? parsedTerm
                        : undefined,
            };
        }, [selectedPeriod]);

    useEffect(() => {
        const controller =
            new AbortController();

        async function loadRecords(): Promise<void> {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const result =
                    await getStudentRecords(
                        {
                            search:
                                appliedSearch,

                            academicYear:
                                selectedAcademicPeriod
                                    .academicYear,

                            termNumber:
                                selectedAcademicPeriod
                                    .termNumber,

                            status:
                                status ||
                                undefined,

                            page,
                            limit: 10,
                        },

                        controller.signal,
                    );

                setData(result);
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
                    StudentRecordApiError
                ) {
                    if (
                        error.status === 401
                    ) {
                        router.replace(
                            "/login",
                        );

                        return;
                    }

                    setErrorMessage(
                        error.message,
                    );

                    return;
                }

                setErrorMessage(
                    "The student records could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadRecords();

        return () => {
            controller.abort();
        };
    }, [
        appliedSearch,
        page,
        router,
        selectedAcademicPeriod,
        status,
        retryKey,
    ]);

    useEffect(() => {
        if (!statusNotification) {
            return;
        }

        const timeout =
            window.setTimeout(() => {
                setStatusNotification(
                    null,
                );
            }, 5000);

        return () => {
            window.clearTimeout(
                timeout,
            );
        };
    }, [
        statusNotification,
    ]);

    function clearFilters(): void {
        setSearch("");
        setAppliedSearch("");
        setSelectedPeriod("");
        setStatus("");
        setPage(1);
    }

    const firstVisibleEntry =
        data &&
        data.pagination.totalItems > 0
            ? (data.pagination.page - 1) *
                  data.pagination.limit +
              1
            : 0;

    const lastVisibleEntry =
        data
            ? Math.min(
                  data.pagination.page *
                      data.pagination.limit,
                  data.pagination.totalItems,
              )
            : 0;

    if (
        isLoading &&
        !data
    ) {
        return (
            <PageContainer>
                <div className="mx-auto w-full max-w-[1440px] space-y-5">
                    <header>
                        <LoadingSkeleton className="h-10 w-48" />
                        <LoadingSkeleton className="mt-3 h-4 w-72 max-w-full" />
                    </header>

                    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {Array.from({
                            length: 6,
                        }).map((_, index) => (
                            <LoadingSkeleton
                                key={index}
                                className="h-28 w-full rounded-xl"
                            />
                        ))}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 xl:flex-row xl:items-center">
                            <LoadingSkeleton className="h-6 w-44 xl:mr-auto" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[280px]" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[230px]" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[210px]" />
                        </div>

                        <div className="space-y-4 p-5">
                            {Array.from({
                                length: 7,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 gap-3 border-b border-neutral-100 pb-4 lg:grid-cols-6"
                                >
                                    {Array.from({
                                        length: 6,
                                    }).map((__, cellIndex) => (
                                        <LoadingSkeleton
                                            key={cellIndex}
                                            className="h-5 w-full"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </PageContainer>
        );
    }

    if (
        errorMessage &&
        !data
    ) {
        return (
            <ServiceUnavailable
                title="Academic records unavailable"
                description={errorMessage}
                serviceName="Student Records Service"
                onRetry={() => {
                    setRetryKey(
                        (current) =>
                            current + 1,
                    );
                }}
            />
        );
    }


    return (
        <PageContainer>
            <div
                className="
                    mx-auto w-full
                    max-w-[1440px]
                    space-y-5
                "
            >
                <header className="text-center sm:text-left">
                    <h1
                        className="
                            font-serif text-3xl
                            font-semibold
                            text-[#35822E]
                            sm:text-4xl
                        "
                    >
                        Academic Records
                    </h1>

                    <p
                        className="
                            mt-1 text-sm
                            text-neutral-600
                        "
                    >
                        Track your curriculum
                        progress and completed
                        requirements.
                    </p>
                </header>

                {data ? (
                    <section
                        aria-label="Academic record summary"
                        className="
                            grid grid-cols-2
                            gap-3
                            md:grid-cols-3
                            xl:grid-cols-5
                        "
                    >
                        <SummaryCard
                            label="Required Units"
                            value={
                                data.summary
                                    .requiredUnits
                            }
                        />

                        <SummaryCard
                            label="Earned Units"
                            value={
                                data.summary
                                    .earnedUnits
                            }
                        />

                        <SummaryCard
                            label="Remaining Units"
                            value={
                                data.summary
                                    .remainingUnits
                            }
                        />

                        <SummaryCard
                            label="Enrolled Units"
                            value={
                                data.summary
                                    .enrolledUnits
                            }
                        />

                        <SummaryCard
                            label="Enlisted Units"
                            value={
                                data.summary
                                    .enlistedUnits
                            }
                        />
                    </section>
                ) : (
                    <section
                        aria-label="Loading record summary"
                        className="
                            grid grid-cols-2
                            gap-3
                            md:grid-cols-3
                            xl:grid-cols-5
                        "
                    >
                        {Array.from({
                            length: 5,
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="
                                    h-[104px]
                                    animate-pulse
                                    rounded-xl
                                    bg-neutral-200
                                    sm:h-[112px]
                                "
                            />
                        ))}
                    </section>
                )}

                <section
                    className="
                        overflow-hidden
                        rounded-xl border
                        border-neutral-200
                        bg-white shadow-sm
                    "
                >
                    <div
                        className="
                            border-b
                            border-neutral-200
                            px-4 py-4
                            sm:px-5
                        "
                    >
                        <div
                            className="
                                flex flex-col
                                gap-4
                                xl:flex-row
                                xl:items-center
                            "
                        >
                            <div className="xl:mr-auto">
                                <h2
                                    className="
                                        text-lg
                                        font-semibold
                                        text-[#35822E]
                                    "
                                >
                                    Course History
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        text-neutral-500
                                    "
                                >
                                    View your complete
                                    curriculum progression
                                    by academic term.
                                </p>
                            </div>

                            <div
                                className="
                                    grid
                                    w-full
                                    grid-cols-1
                                    gap-3
                                    sm:grid-cols-2
                                    xl:w-auto
                                    xl:grid-cols-[300px_230px_210px_auto]
                                "
                            >
                                <div
                                    className="
                                        relative
                                        sm:col-span-2
                                        xl:col-span-1
                                    "
                                >
                                    <Search
                                        aria-hidden="true"
                                        className="
                                            absolute
                                            left-3 top-1/2
                                            h-4 w-4
                                            -translate-y-1/2
                                            text-neutral-400
                                        "
                                    />

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(
                                                event.target.value,
                                            );
                                        }}
                                        placeholder="Search subject or course code"
                                        className="
                                            h-11
                                            w-full
                                            rounded-lg
                                            border
                                            border-neutral-300
                                            bg-white
                                            pl-10 pr-3
                                            text-sm
                                            text-neutral-900
                                            outline-none
                                            transition
                                            placeholder:text-neutral-400
                                            focus:border-[#35822E]
                                            focus:ring-4
                                            focus:ring-[#35822E]/10
                                        "
                                    />
                                </div>

                                <select
                                    aria-label="Filter by academic term"
                                    value={selectedPeriod}
                                    onChange={(event) => {
                                        setSelectedPeriod(
                                            event.target.value,
                                        );

                                        setPage(1);
                                    }}
                                    className="
                                        h-11
                                        w-full
                                        rounded-lg
                                        border
                                        border-neutral-300
                                        bg-white
                                        px-3
                                        text-sm
                                        text-neutral-800
                                        outline-none
                                        transition
                                        focus:border-[#35822E]
                                        focus:ring-4
                                        focus:ring-[#35822E]/10
                                    "
                                >
                                    <option value="">
                                        Academic Terms
                                    </option>

                                    {data?.filters.academicPeriods.map((period) => {
                                        const value = `${period.academicYear}|${period.termNumber}`;

                                        return (
                                            <option key={value} value={value}>
                                                {period.label}
                                            </option>
                                        );
                                    })}
                                        
                                </select>

                                <select
                                    aria-label="Filter by record status"
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(
                                            event.target.value as
                                                | StudentRecordStatus
                                                | "",
                                        );

                                        setPage(1);
                                    }}
                                    className="
                                        h-11
                                        w-full
                                        rounded-lg
                                        border
                                        border-neutral-300
                                        bg-white
                                        px-3
                                        text-sm
                                        text-neutral-800
                                        outline-none
                                        transition
                                        focus:border-[#35822E]
                                        focus:ring-4
                                        focus:ring-[#35822E]/10
                                    "
                                >
                                    <option value="">
                                        Status
                                    </option>

                                    {selectableStatuses.map(
                                        ([
                                            statusValue,
                                            label,
                                        ]) => (
                                            <option
                                                key={
                                                    statusValue
                                                }
                                                value={
                                                    statusValue
                                                }
                                            >
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>

                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="
                                        h-11
                                        rounded-lg
                                        border
                                        border-neutral-300
                                        bg-white
                                        px-4
                                        text-sm
                                        font-medium
                                        text-neutral-600
                                        transition
                                        hover:border-[#35822E]
                                        hover:text-[#35822E]
                                    "
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {errorMessage ? (
                        <div
                            role="alert"
                            className="
                                m-4 rounded-lg
                                border border-red-200
                                bg-red-50 px-4 py-3
                                text-center text-sm
                                text-red-700
                                sm:m-5
                            "
                        >
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="hidden lg:block">
                        <div className="overflow-x-auto">
                            <table
                                className="
                                    w-full
                                    min-w-[900px]
                                    table-fixed
                                    border-collapse
                                    text-sm
                                "
                            >
                                <colgroup>
                                    <col className="w-[32%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[16%]" />
                                    <col className="w-[10%]" />
                                    <col className="w-[18%]" />
                                </colgroup>

                                <thead
                                    className="
                                        bg-[#35822E]/35
                                        text-neutral-800
                                    "
                                >
                                    <tr>
                                        <th className="px-5 py-3 text-left">
                                            Course
                                        </th>

                                        <th className="px-5 py-3 text-center">
                                            Course Code
                                        </th>

                                        <th className="px-5 py-3 text-center">
                                            Units
                                        </th>

                                        <th className="px-5 py-3 text-center">
                                            Academic Year
                                        </th>

                                        <th className="px-5 py-3 text-center">
                                            Term
                                        </th>

                                        <th className="px-5 py-3 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                                className="
                                                    px-5 py-16
                                                    text-center
                                                    text-neutral-500
                                                "
                                            >
                                                Loading
                                                academic
                                                records...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading &&
                                    !errorMessage &&
                                    data
                                        ?.records
                                        .length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    6
                                                }
                                                className="
                                                    px-5 py-16
                                                    text-center
                                                    text-neutral-500
                                                "
                                            >
                                                No records
                                                matched the
                                                selected
                                                filters.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading &&
                                    !errorMessage
                                        ? data?.records.map(
                                              (
                                                  record,
                                              ) => (
                                                  <DesktopRecordRow
                                                      key={
                                                          record.id
                                                      }
                                                      record={
                                                          record
                                                      }
                                                      onStatusClick={
                                                          setStatusNotification
                                                      }
                                                  />
                                              ),
                                          )
                                        : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div
                        className="
                            space-y-3 p-4
                            lg:hidden
                        "
                    >
                        {isLoading ? (
                            Array.from({
                                length: 4,
                            }).map(
                                (_, index) => (
                                    <div
                                        key={
                                            index
                                        }
                                        className="
                                            h-40
                                            animate-pulse
                                            rounded-xl
                                            bg-neutral-200
                                        "
                                    />
                                ),
                            )
                        ) : null}

                        {!isLoading &&
                        !errorMessage &&
                        data?.records.length ===
                            0 ? (
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-neutral-300
                                    px-4 py-12
                                    text-center
                                    text-sm
                                    text-neutral-500
                                "
                            >
                                No records matched
                                the selected filters.
                            </div>
                        ) : null}

                        {!isLoading &&
                        !errorMessage
                            ? data?.records.map(
                                  (record) => (
                                      <MobileRecordCard
                                          key={
                                              record.id
                                          }
                                          record={
                                              record
                                          }
                                          onStatusClick={
                                              setStatusNotification
                                          }
                                      />
                                  ),
                              )
                            : null}
                    </div>

                    <footer
                        className="
                            flex flex-col
                            items-center gap-4
                            border-t
                            border-neutral-200
                            px-4 py-4
                            sm:flex-row
                            sm:justify-between
                            sm:px-5
                        "
                    >
                        <p
                            className="
                                text-center text-xs
                                text-neutral-500
                                sm:text-left
                            "
                        >
                            Showing{" "}
                            {firstVisibleEntry}–
                            {lastVisibleEntry} of{" "}
                            {data?.pagination
                                .totalItems ?? 0}{" "}
                            entries
                        </p>

                        <div
                            className="
                                flex w-full
                                items-center
                                justify-center
                                gap-2
                                sm:w-auto
                            "
                        >
                            <button
                                type="button"
                                disabled={
                                    !data ||
                                    isLoading ||
                                    data
                                        .pagination
                                        .page <= 1
                                }
                                onClick={() => {
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            Math.max(
                                                1,
                                                current -
                                                    1,
                                            ),
                                    );
                                }}
                                className="
                                    inline-flex h-10
                                    flex-1 items-center
                                    justify-center gap-1
                                    rounded-lg border
                                    border-neutral-300
                                    px-3 text-sm
                                    font-medium
                                    text-neutral-700
                                    transition
                                    hover:border-[#35822E]
                                    hover:text-[#35822E]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                    sm:flex-none
                                "
                            >
                                <ChevronLeft
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                />

                                Previous
                            </button>

                            <span
                                aria-label={`Page ${
                                    data?.pagination
                                        .page ?? 1
                                }`}
                                className="
                                    inline-flex h-10
                                    min-w-10
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#35822E]
                                    px-3 text-sm
                                    font-semibold
                                    text-white
                                "
                            >
                                {data?.pagination
                                    .page ?? 1}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    !data ||
                                    isLoading ||
                                    data
                                        .pagination
                                        .page >=
                                        data
                                            .pagination
                                            .totalPages
                                }
                                onClick={() => {
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current +
                                            1,
                                    );
                                }}
                                className="
                                    inline-flex h-10
                                    flex-1 items-center
                                    justify-center gap-1
                                    rounded-lg border
                                    border-neutral-300
                                    px-3 text-sm
                                    font-medium
                                    text-neutral-700
                                    transition
                                    hover:border-[#35822E]
                                    hover:text-[#35822E]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                    sm:flex-none
                                "
                            >
                                Next

                                <ChevronRight
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                />
                            </button>
                        </div>
                    </footer>
                </section>
            </div>

            {statusNotification ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="
                        fixed right-4 top-4 z-50
                        w-[calc(100%-2rem)]
                        max-w-sm rounded-xl
                        border border-neutral-200
                        bg-white p-4
                        shadow-2xl
                        sm:right-6 sm:top-6
                    "
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={[
                                `
                                    mt-0.5 flex
                                    h-9 w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                `,
                                getStatusIconClassName(
                                    statusNotification,
                                ),
                            ].join(" ")}
                        >
                            {usesPositiveStatusIcon(
                                statusNotification,
                            ) ? (
                                <CircleCheck className="h-5 w-5" />
                            ) : (
                                <CircleAlert className="h-5 w-5" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#35822E]">
                                {
                                    statusNotification
                                        .courseCode
                                }
                            </p>

                            <h2 className="mt-0.5 text-sm font-semibold text-neutral-900">
                                {statusNotification
                                    .eligibilityTitle ||
                                    getStatusLabel(
                                        statusNotification,
                                    )}
                            </h2>

                            <p className="mt-1 text-sm leading-5 text-neutral-600">
                                {
                                    statusNotification
                                        .eligibilityMessage
                                }
                            </p>

                            {statusNotification
                                .missingPrerequisiteCodes
                                .length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {statusNotification
                                        .missingPrerequisiteCodes
                                        .map(
                                            (
                                                prerequisite,
                                            ) => (
                                                <span
                                                    key={
                                                        prerequisite
                                                    }
                                                    className="
                                                        rounded-full
                                                        bg-neutral-100
                                                        px-2.5 py-1
                                                        text-xs
                                                        font-semibold
                                                        text-neutral-700
                                                    "
                                                >
                                                    {
                                                        prerequisite
                                                    }
                                                </span>
                                            ),
                                        )}
                                </div>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            aria-label="Close status notification"
                            onClick={() => {
                                setStatusNotification(
                                    null,
                                );
                            }}
                            className="
                                inline-flex
                                h-8 w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-neutral-500
                                transition
                                hover:bg-neutral-100
                                hover:text-neutral-800
                            "
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : null}
        </PageContainer>
    );
}