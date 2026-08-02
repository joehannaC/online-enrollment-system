"use client";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    useRouter,
} from "next/navigation";
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
    getStudentGrades,
    StudentGradeApiError,
} from "@/lib/api/studentGradeApi";
import type {
    StudentGradeItem,
    StudentGradeResponse,
    StudentGradeStatus,
} from "@/types";

const statusLabels: Record<
    StudentGradeStatus,
    string
> = {
    PASSED: "Passed",
    FAILED: "Failed",
    CREDITED: "Credited",
};

const statusClasses: Record<
    StudentGradeStatus,
    string
> = {
    PASSED:
        "border-green-400 bg-green-50 text-green-700",

    FAILED:
        "border-red-400 bg-red-50 text-red-700",

    CREDITED:
        "border-blue-400 bg-blue-50 text-blue-700",
};

function StatusBadge({
    status,
}: {
    status: StudentGradeStatus;
}) {
    return (
        <span
            className={[
                "inline-flex min-w-[108px] justify-center",
                "rounded-full border px-3 py-1",
                "text-xs font-medium",
                statusClasses[status],
            ].join(" ")}
        >
            {statusLabels[status]}
        </span>
    );
}

function GradeRow({
    grade,
}: {
    grade: StudentGradeItem;
}) {
    return (
        <tr
            className="
                border-b border-neutral-200
                transition hover:bg-neutral-50
                last:border-b-0
            "
        >
            <td
                className="
                    px-5 py-4
                    font-medium
                    text-neutral-900
                "
            >
                {grade.courseName}
            </td>

            <td
                className="
                    px-5 py-4
                    text-center
                    font-medium
                    text-neutral-800
                "
            >
                {grade.courseCode}
            </td>

            <td
                className="
                    px-5 py-4
                    text-center
                    font-medium
                    text-neutral-800
                "
            >
                {grade.units}
            </td>

            <td
                className="
                    px-5 py-4
                    text-center
                    font-semibold
                    text-neutral-900
                "
            >
                {grade.grade}
            </td>

            <td className="px-5 py-4 text-center">
                <StatusBadge
                    status={
                        grade.status
                    }
                />
            </td>
        </tr>
    );
}

function MobileGradeCard({
    grade,
}: {
    grade: StudentGradeItem;
}) {
    return (
        <article
            className="
                rounded-xl border
                border-neutral-200
                bg-white p-4
                shadow-sm
            "
        >
            <div
                className="
                    flex items-start
                    justify-between
                    gap-3
                "
            >
                <div className="min-w-0">
                    <h3
                        className="
                            font-semibold
                            text-neutral-900
                        "
                    >
                        {grade.courseName}
                    </h3>

                    <p
                        className="
                            mt-1 text-sm
                            font-medium
                            text-[#35822E]
                        "
                    >
                        {grade.courseCode}
                    </p>
                </div>

                <StatusBadge
                    status={
                        grade.status
                    }
                />
            </div>

            <dl
                className="
                    mt-4 grid
                    grid-cols-2 gap-3
                    border-t
                    border-neutral-100
                    pt-4 text-center
                "
            >
                <div>
                    <dt className="text-xs text-neutral-500">
                        Units
                    </dt>

                    <dd
                        className="
                            mt-1 font-semibold
                            text-neutral-900
                        "
                    >
                        {grade.units}
                    </dd>
                </div>

                <div>
                    <dt className="text-xs text-neutral-500">
                        Grade
                    </dt>

                    <dd
                        className="
                            mt-1 font-bold
                            text-neutral-900
                        "
                    >
                        {grade.grade}
                    </dd>
                </div>
            </dl>
        </article>
    );
}

export default function StudentGradesPage() {
    const router =
        useRouter();

    const [
        data,
        setData,
    ] =
        useState<StudentGradeResponse | null>(
            null,
        );

    const [
        selectedPeriod,
        setSelectedPeriod,
    ] = useState("");

    const [
        status,
        setStatus,
    ] =
        useState<
            StudentGradeStatus | ""
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
        }, [
            selectedPeriod,
        ]);

    useEffect(() => {
        const controller =
            new AbortController();

        async function loadGrades(): Promise<void> {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const result =
                    await getStudentGrades(
                        {
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
                    StudentGradeApiError
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
                    "The student grades could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadGrades();

        return () => {
            controller.abort();
        };
    }, [
        page,
        router,
        selectedAcademicPeriod,
        status,
        retryKey,
    ]);

    function clearFilters(): void {
        setSelectedPeriod("");
        setStatus("");
        setPage(1);
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

                {data ? (
                    <section
                        className="
                            flex flex-col gap-4
                            rounded-xl border
                            border-[#35822E]/50
                            bg-white p-4
                            shadow-sm
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                            lg:p-5
                        "
                    >
                        <div>
                            <h2
                                className="
                                    font-semibold
                                    text-neutral-900
                                "
                            >
                                {
                                    data.summary
                                        .programName
                                }
                            </h2>

                            <div
                                className="
                                    mt-3 grid
                                    grid-cols-1
                                    gap-x-8 gap-y-2
                                    text-sm
                                    text-neutral-600
                                    sm:grid-cols-2
                                "
                            >
                                <p>
                                    Curriculum:{" "}
                                    {
                                        data.summary
                                            .curriculumCode
                                    }
                                </p>

                                <p>
                                    {
                                        data.summary
                                            .campus
                                    }
                                </p>

                                <p>
                                    Student No.:{" "}
                                    {
                                        data.summary
                                            .studentNumber
                                    }
                                </p>

                                <p>
                                    {
                                        data.summary
                                            .college
                                    }
                                </p>
                            </div>
                        </div>

                        <div
                            className="
                                min-w-[190px]
                                rounded-lg
                                bg-[#35822E]
                                px-5 py-4
                                text-white
                            "
                        >
                            <p className="text-xs text-white/80">
                                Current GPA
                            </p>

                            <p
                                className="
                                    mt-1 text-3xl
                                    font-bold
                                "
                            >
                                {data.summary
                                    .currentGpa !==
                                null
                                    ? data.summary.currentGpa.toFixed(
                                          2,
                                      )
                                    : "-.--"}
                            </p>
                        </div>
                    </section>
                ) : null}

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
                                        font-serif
                                        text-3xl
                                        font-semibold
                                        text-[#35822E]
                                        sm:text-4xl
                                    "
                                >
                                    Grades
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-neutral-600
                                    "
                                >
                                    View grades by academic session.
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
                                    xl:grid-cols-[260px_190px_auto]
                                "
                            >
                                <select
                                    aria-label="Filter by academic session"
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
                                        Academic Session
                                    </option>

                                    {data?.filters
                                        .academicPeriods
                                        .map((period) => {
                                            const value =
                                                `${period.academicYear}|${period.termNumber}`;

                                        
    if (
        isLoading &&
        !data
    ) {
        return (
            <PageContainer>
                <div className="mx-auto w-full max-w-[1440px] space-y-5">
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                                <LoadingSkeleton className="h-5 w-72 max-w-full" />
                                <LoadingSkeleton className="h-4 w-64 max-w-full" />
                                <LoadingSkeleton className="h-4 w-52 max-w-full" />
                            </div>

                            <LoadingSkeleton className="h-24 w-full rounded-lg lg:w-48" />
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 xl:flex-row xl:items-center">
                            <div className="space-y-3 xl:mr-auto">
                                <LoadingSkeleton className="h-10 w-40" />
                                <LoadingSkeleton className="h-4 w-64 max-w-full" />
                            </div>

                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[260px]" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[190px]" />
                            <LoadingSkeleton className="h-11 w-24 rounded-lg" />
                        </div>

                        <div className="space-y-4 p-5">
                            {Array.from({
                                length: 7,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 gap-3 border-b border-neutral-100 pb-4 lg:grid-cols-5"
                                >
                                    {Array.from({
                                        length: 5,
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
            <PageContainer>
                <ServiceUnavailable
                    title="Grades unavailable"
                    description={errorMessage}
                    serviceName="Grade Service"
                    onRetry={() => {
                        setRetryKey(
                            (current) =>
                                current + 1,
                        );
                    }}
                />
            </PageContainer>
        );
    }

    return (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {period.label}
                                                </option>
                                            );
                                        })}
                                </select>

                                <select
                                    aria-label="Filter by grade status"
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(
                                            event.target.value as
                                                | StudentGradeStatus
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

                                    <option value="PASSED">
                                        Passed
                                    </option>

                                    <option value="FAILED">
                                        Failed
                                    </option>

                                    <option value="CREDITED">
                                        Credited
                                    </option>
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
                                text-sm text-red-700
                            "
                        >
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="hidden md:block">
                        <table
                            className="
                                w-full
                                table-fixed
                                border-collapse
                                text-sm
                            "
                        >
                            <colgroup>
                                <col className="w-[36%]" />
                                <col className="w-[20%]" />
                                <col className="w-[12%]" />
                                <col className="w-[14%]" />
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
                                        Course Name
                                    </th>

                                    <th className="px-5 py-3 text-center">
                                        Course Code
                                    </th>

                                    <th className="px-5 py-3 text-center">
                                        Units
                                    </th>

                                    <th className="px-5 py-3 text-center">
                                        Grade
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
                                                5
                                            }
                                            className="
                                                px-5 py-16
                                                text-center
                                                text-neutral-500
                                            "
                                        >
                                            Loading grades...
                                        </td>
                                    </tr>
                                ) : null}

                                {!isLoading &&
                                !errorMessage &&
                                data?.grades
                                    .length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                5
                                            }
                                            className="
                                                px-5 py-16
                                                text-center
                                                text-neutral-500
                                            "
                                        >
                                            No grades matched
                                            the selected
                                            filters.
                                        </td>
                                    </tr>
                                ) : null}

                                {!isLoading &&
                                !errorMessage
                                    ? data?.grades.map(
                                          (
                                              grade,
                                          ) => (
                                              <GradeRow
                                                  key={
                                                      grade.id
                                                  }
                                                  grade={
                                                      grade
                                                  }
                                              />
                                          ),
                                      )
                                    : null}
                            </tbody>
                        </table>
                    </div>

                    <div
                        className="
                            space-y-3 p-4
                            md:hidden
                        "
                    >
                        {!isLoading &&
                        !errorMessage
                            ? data?.grades.map(
                                  (grade) => (
                                      <MobileGradeCard
                                          key={
                                              grade.id
                                          }
                                          grade={
                                              grade
                                          }
                                      />
                                  ),
                              )
                            : null}
                    </div>

                    <footer
                        className="
                            flex flex-col
                            items-center gap-3
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
                                text-xs
                                text-neutral-500
                            "
                        >
                            Showing{" "}
                            {data?.grades.length ??
                                0}{" "}
                            of{" "}
                            {data?.pagination
                                .totalItems ?? 0}{" "}
                            entries
                        </p>

                        <div
                            className="
                                flex items-center
                                gap-2
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
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            Math.max(
                                                1,
                                                current -
                                                    1,
                                            ),
                                    )
                                }
                                className="
                                    inline-flex h-9
                                    items-center gap-1
                                    rounded-lg border
                                    border-neutral-300
                                    px-3 text-sm
                                    disabled:opacity-40
                                "
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>

                            <span
                                className="
                                    inline-flex h-9
                                    min-w-9
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
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current +
                                            1,
                                    )
                                }
                                className="
                                    inline-flex h-9
                                    items-center gap-1
                                    rounded-lg border
                                    border-neutral-300
                                    px-3 text-sm
                                    disabled:opacity-40
                                "
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </footer>
                </section>
            </div>
        </PageContainer>
    );
}