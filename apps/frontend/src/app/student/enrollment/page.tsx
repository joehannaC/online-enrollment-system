"use client";

import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CircleAlert,
    CircleCheck,
    Eye,
    Pencil,
    Search,
    X,
} from "lucide-react";
import Link from "next/link";
import {
    useRouter,
} from "next/navigation";
import {
    useCallback,
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
    addEnrollmentDraftItem,
    getStudentEnrollment,
    StudentEnrollmentApiError,
} from "@/lib/api/studentEnrollmentApi";
import type {
    EnrollmentSectionOption,
    StudentEnrollmentResponse,
} from "@/types";

function formatUnitTotal(
    academicUnits: number,
    nonAcademicUnits: number,
): string {
    return nonAcademicUnits > 0
        ? `${academicUnits}(${nonAcademicUnits})`
        : String(academicUnits);
}

function getActionLabel(
    course: EnrollmentSectionOption,
): string {
    switch (
        course.eligibilityCode
    ) {
        case "ALREADY_COMPLETED":
            return "Completed";

        case "ALREADY_CREDITED":
            return "Credited";

        case "ALREADY_ENROLLED":
            return "Enrolled";

        case "ALREADY_SELECTED":
            return "Selected";

        case "MISSING_PREREQUISITES":
            return "Unavailable";

        case "SECTION_FULL":
            return "Full";

        default:
            return "Enroll";
    }
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(
        "en-PH",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Manila",
        },
    ).format(new Date(value));
}


function MobileCourseCard({
    course,
    isEnrollmentOpen,
    isMutating,
    onEnroll,
}: {
    course: EnrollmentSectionOption;
    isEnrollmentOpen: boolean;
    isMutating: boolean;
    onEnroll: (
        sectionId: string,
    ) => Promise<void>;
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
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-900">
                        {course.courseName}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-[#35822E]">
                        {course.courseCode}
                        {" • "}
                        {course.sectionCode}
                    </p>
                </div>

                <span
                    className={[
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        isEnrollmentOpen &&
                        course.isFull
                            ? "border-red-300 bg-red-50 text-red-700"
                            : isEnrollmentOpen &&
                                course.enrolledCount >=
                                    course.capacity - 5
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : "border-green-300 bg-green-50 text-green-700",
                    ].join(" ")}
                >
                    {isEnrollmentOpen
                        ? course.enrolledCount
                        : 0}
                    /{course.capacity}
                </span>
            </div>

            <dl className="mt-4 space-y-3 border-t border-neutral-100 pt-4 text-sm">
                <div>
                    <dt className="text-xs text-neutral-500">
                        Units
                    </dt>
                    <dd className="mt-1 font-semibold text-neutral-800">
                        {formatUnitTotal(
                            course.academicUnits,
                            course.nonAcademicUnits,
                        )}
                    </dd>
                </div>

                <div>
                    <dt className="text-xs text-neutral-500">
                        Schedule
                    </dt>
                    <dd className="mt-1 text-neutral-800">
                        {course.scheduleLabel}
                    </dd>
                </div>

                <div>
                    <dt className="text-xs text-neutral-500">
                        Instructor
                    </dt>
                    <dd className="mt-1 text-neutral-800">
                        {course.instructorName}
                    </dd>
                </div>
            </dl>


            <button
                type="button"
                disabled={
                    !course.canEnroll ||
                    isMutating
                }
                onClick={() => {
                    if (
                        course.sectionId
                    ) {
                        void onEnroll(
                            course.sectionId,
                        );
                    }
                }}
                className="
                    mt-4 h-10 w-full
                    rounded-lg
                    bg-[#35822E]
                    text-sm font-semibold
                    text-white transition
                    hover:bg-[#2B6D26]
                    disabled:cursor-not-allowed
                    disabled:bg-neutral-300
                "
            >
                {getActionLabel(
                    course,
                )}
            </button>
        </article>
    );
}

type ActionNotification = {
    type: "SUCCESS" | "ERROR";
    title: string;
    message: string;
};

export default function StudentEnrollmentPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<StudentEnrollmentResponse | null>(
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
        availability,
        setAvailability,
    ] =
        useState<
            "ALL" | "OPEN" | "FULL"
        >("ALL");

    const [
        page,
        setPage,
    ] = useState(1);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isMutating,
        setIsMutating,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        actionNotification,
        setActionNotification,
    ] =
        useState<ActionNotification | null>(
            null,
        );


    const loadEnrollment =
        useCallback(
            async (
                signal?: AbortSignal,
            ): Promise<void> => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const result =
                        await getStudentEnrollment(
                            {
                                search:
                                    appliedSearch,
                                availability,
                                page,
                                limit: 10,
                            },
                            signal,
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
                        StudentEnrollmentApiError
                    ) {
                        if (
                            error.status ===
                            401
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
                        "The enrollment page could not be loaded.",
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            [
                appliedSearch,
                availability,
                page,
                router,
            ],
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
    }, [
        search,
    ]);

    useEffect(() => {
        const controller =
            new AbortController();

        void loadEnrollment(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [
        loadEnrollment,
    ]);


    useEffect(() => {
        if (!actionNotification) {
            return;
        }

        const timeout =
            window.setTimeout(() => {
                setActionNotification(
                    null,
                );
            }, 5000);

        return () => {
            window.clearTimeout(
                timeout,
            );
        };
    }, [
        actionNotification,
    ]);

    async function handleEnroll(
        sectionId: string,
    ): Promise<void> {
        if (
            !data ||
            isMutating
        ) {
            return;
        }

        setIsMutating(true);
        setErrorMessage("");
        setActionNotification(
            null,
        );

        try {
            await addEnrollmentDraftItem(
                sectionId,
                data.enrollment.version,
            );

            await loadEnrollment();

            setActionNotification({
                type: "SUCCESS",
                title:
                    "Course selected",
                message:
                    "The course was added to your enrollment draft.",
            });
        } catch (error) {
            if (
                error instanceof
                StudentEnrollmentApiError
            ) {
                setActionNotification({
                    type: "ERROR",
                    title:
                        "Enrollment unsuccessful",
                    message:
                        error.code ===
                        "SECTION_FULL"
                            ? "This section is already full. Please enroll in another open section."
                            : error.message,
                });

                if (
                    error.code ===
                    "ENROLLMENT_VERSION_CONFLICT"
                ) {
                    await loadEnrollment();
                }

                return;
            }

            setActionNotification({
                type: "ERROR",
                title:
                    "Enrollment unsuccessful",
                message:
                    "The course could not be added.",
            });
        } finally {
            setIsMutating(false);
        }
    }

    const submitted =
        data?.enrollment.status ===
        "SUBMITTED";

    const enrollmentHasEnded =
        useMemo(() => {
            if (!data) {
                return false;
            }

            return (
                new Date() >
                new Date(
                    data.term.enrollmentEnd,
                )
            );
        }, [
            data,
        ]);

    const shouldShowAvailableCourses =
        Boolean(
            data &&
                !submitted &&
                !enrollmentHasEnded,
        );

    const canEdit =
        Boolean(
            data?.term
                .isEnrollmentOpen &&
                !submitted &&
                data.enrollment.items.some(
                    (item) => item.canDrop,
                ),
        );

    const isEnrollmentComingSoon =
        Boolean(
            data &&
                !data.term.isEnrollmentOpen &&
                data.enrollment.items.length === 0 &&
                data.availableSections.length === 0,
        );

    const selectedAcademicUnits =
        isEnrollmentComingSoon
            ? 0
            : data?.enrollment
                  .totalAcademicUnits ?? 0;


    if (
        isLoading &&
        !data
    ) {
        return (
            <PageContainer>
                <div className="mx-auto w-full max-w-[1440px] space-y-5">
                    <header>
                        <LoadingSkeleton className="h-10 w-56" />
                        <LoadingSkeleton className="mt-3 h-4 w-80 max-w-full" />
                    </header>

                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                                <LoadingSkeleton className="h-5 w-48" />
                                <div className="flex flex-wrap gap-5">
                                    <LoadingSkeleton className="h-4 w-28" />
                                    <LoadingSkeleton className="h-4 w-28" />
                                </div>
                            </div>

                            <div className="space-y-3 lg:flex lg:items-center lg:gap-3 lg:space-y-0">
                                <LoadingSkeleton className="h-4 w-44" />
                                <LoadingSkeleton className="h-10 w-40 rounded-lg" />
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 xl:flex-row xl:items-center">
                            <LoadingSkeleton className="h-6 w-44 xl:mr-auto" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[300px]" />
                            <LoadingSkeleton className="h-11 w-full rounded-lg sm:w-[210px]" />
                        </div>

                        <div className="space-y-4 p-5">
                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 gap-3 border-b border-neutral-100 pb-4 lg:grid-cols-7"
                                >
                                    {Array.from({
                                        length: 7,
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
                title="Enrollment unavailable"
                description={errorMessage}
                serviceName="Enrollment Service"
                onRetry={() => {
                    void loadEnrollment();
                }}
            />
        );
    }

    return (
        <PageContainer>
            <div className="mx-auto w-full max-w-[1440px] space-y-5">
                <header>
                    <h1 className="font-serif text-3xl font-semibold text-[#35822E] sm:text-4xl">
                        Enrollment
                    </h1>

                    <p className="mt-1 text-sm text-neutral-600">
                        {isEnrollmentComingSoon
                            ? "Enrollment for the next academic term is coming soon."
                            : "Browse available courses and enroll while slots are open."}
                    </p>
                </header>

                {data ? (
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
                                        Selected:{" "}
                                        {
                                            selectedAcademicUnits
                                        }{" "}
                                        units
                                    </p>

                                    <p>
                                        Maximum:{" "}
                                        {
                                            data.term
                                                .maximumAcademicUnits
                                        }{" "}
                                        units
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 lg:items-end">
                                <p className="text-sm font-semibold text-[#35822E]">
                                    {isEnrollmentComingSoon
                                        ? "Enrollment coming soon"
                                        : `Enrollment closes ${formatDate(
                                              data.term.enrollmentEnd,
                                          )}`}
                                </p>

                                {!isEnrollmentComingSoon ? (
                                    <div className="flex flex-col gap-2 sm:flex-row">

                                    {canEdit ? (
                                        <Link
                                            href="/student/enrollment/edit"
                                            className="
                                                inline-flex h-10
                                                items-center
                                                justify-center
                                                gap-2 rounded-lg
                                                bg-[#35822E]
                                                px-5 text-sm
                                                font-semibold
                                                text-white
                                                transition
                                                hover:bg-[#2B6D26]
                                            "
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Enrollment
                                        </Link>
                                    ) : null}

                                        <Link
                                        href="/student/enrollment/summary"
                                        className="
                                            inline-flex h-10
                                            items-center
                                            justify-center
                                            gap-2 rounded-lg
                                            bg-[#35822E]
                                            px-5 text-sm
                                            font-semibold
                                            text-white
                                            transition
                                            hover:bg-[#2B6D26]
                                        "
                                    >
                                        <Eye className="h-4 w-4" />
                                        View Enrollment
                                    </Link>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>
                ) : null}

                {isEnrollmentComingSoon ? (
                    <section className="rounded-xl border border-neutral-200 bg-white px-5 py-16 text-center shadow-sm">
                        <CircleAlert className="mx-auto h-10 w-10 text-[#35822E]" />
                        <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                            No courses to show yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600">
                            Enrollment for Term 2, A.Y. 2026–2027 is coming soon.
                            Please wait for further announcements.
                        </p>
                    </section>
                ) : null}

                {shouldShowAvailableCourses ? (
                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
                            <h2 className="text-lg font-semibold text-[#35822E] xl:mr-auto">
                                Available Courses
                            </h2>

                            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[300px_210px]">
                                <div className="relative">
                                    <Search
                                        aria-hidden="true"
                                        className="absolute text-gray-400 left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                    />

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(
                                            event,
                                        ) => {
                                            setSearch(
                                                event
                                                    .target
                                                    .value,
                                            );
                                        }}
                                        placeholder="Search course or code"
                                        className="h-11 w-full text-gray-400 rounded-lg border border-neutral-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#35822E]"
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        aria-label="Filter sections by slot status"
                                        value={availability}
                                        onChange={(event) => {
                                            setAvailability(
                                                event.target.value as
                                                    | "ALL"
                                                    | "OPEN"
                                                    | "FULL",
                                            );

                                            setPage(1);
                                        }}
                                        className="
                                            h-11 w-full
                                            appearance-none
                                            rounded-lg
                                            border
                                            border-neutral-300
                                            bg-white
                                            px-3 pr-10
                                            text-sm
                                            text-neutral-700
                                            outline-none
                                            transition
                                            focus:border-[#35822E]
                                            focus:ring-4
                                            focus:ring-[#35822E]/10
                                        "
                                    >
                                        <option value="ALL">
                                            Status
                                        </option>

                                        <option value="OPEN">
                                            Open
                                        </option>

                                        <option value="FULL">
                                            Full
                                        </option>
                                    </select>

                                    <ChevronDown
                                        aria-hidden="true"
                                        className="
                                            pointer-events-none
                                            absolute right-3
                                            top-1/2 h-4 w-4
                                            -translate-y-1/2
                                            text-neutral-500
                                        "
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
                                <thead className="bg-[#35822E]/35 text-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Course
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Course Code
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Unit
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Schedule
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Instructor
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Slots
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    7
                                                }
                                                className="px-4 py-16 text-center text-neutral-500"
                                            >
                                                Loading available courses...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading &&
                                    data
                                        ?.availableSections
                                        .length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    7
                                                }
                                                className="px-4 py-16 text-center text-neutral-500"
                                            >
                                                No available courses matched the selected filters.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading
                                        ? data?.availableSections.map(
                                              (
                                                  course,
                                              ) => (
                                                  <tr
                                                      key={
                                                          course.sectionId ??
                                                          course.courseId
                                                      }
                                                      className="border-b border-neutral-200 last:border-b-0"
                                                  >
                                                      <td className="px-4 py-4 font-medium text-neutral-900">
                                                          {
                                                              course.courseName
                                                          }
                                                      </td>
                                                      <td className="px-4 py-4 text-center font-medium text-neutral-800">
                                                          {
                                                              course.courseCode
                                                          }
                                                      </td>
                                                      <td className="px-4 py-4 text-center font-semibold text-neutral-800">
                                                          {formatUnitTotal(
                                                              course.academicUnits,
                                                              course.nonAcademicUnits,
                                                          )}
                                                      </td>
                                                      <td className="px-4 py-4 text-neutral-700">
                                                          {
                                                              course.scheduleLabel
                                                          }
                                                      </td>
                                                      <td className="px-4 py-4 text-neutral-700">
                                                          {
                                                              course.instructorName
                                                          }
                                                      </td>
                                                      <td className="px-4 py-4 text-center">
                                                          <span
                                                              className={[
                                                                  "inline-flex min-w-[88px] justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                                                                  data
                                                                      ?.term
                                                                      .isEnrollmentOpen &&
                                                                  course.isFull
                                                                      ? "border-red-300 bg-red-50 text-red-700"
                                                                      : data
                                                                            ?.term
                                                                            .isEnrollmentOpen &&
                                                                          course.enrolledCount >=
                                                                              course.capacity -
                                                                                  5
                                                                        ? "border-amber-300 bg-amber-50 text-amber-700"
                                                                        : "border-green-300 bg-green-50 text-green-700",
                                                              ].join(
                                                                  " ",
                                                              )}
                                                          >
                                                              {data
                                                                  ?.term
                                                                  .isEnrollmentOpen
                                                                  ? course.enrolledCount
                                                                  : 0}
                                                              /
                                                              {
                                                                  course.capacity
                                                              }
                                                          </span>
                                                      </td>

                                                      <td className="px-4 py-4 text-center">
                                                          <button
                                                              type="button"
                                                              disabled={
                                                                  !course.canEnroll ||
                                                                  isMutating
                                                              }
                                                              onClick={() => {
                                                                  if (
                                                                      course.sectionId
                                                                  ) {
                                                                      void handleEnroll(
                                                                          course.sectionId,
                                                                      );
                                                                  }
                                                              }}
                                                              className="
                                                                  h-9 min-w-[100px]
                                                                  rounded-lg
                                                                  bg-[#35822E]
                                                                  px-4 text-sm
                                                                  font-semibold
                                                                  text-white
                                                                  transition
                                                                  hover:bg-[#2B6D26]
                                                                  disabled:cursor-not-allowed
                                                                  disabled:bg-neutral-300
                                                              "
                                                          >
                                                              {getActionLabel(
                                                                  course,
                                                              )}
                                                          </button>
                                                      </td>
                                                  </tr>
                                              ),
                                          )
                                        : null}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 lg:hidden">
                            {!isLoading
                                ? data?.availableSections.map(
                                      (
                                          course,
                                      ) => (
                                          <MobileCourseCard
                                              key={
                                                  course.sectionId
                                              }
                                              course={
                                                  course
                                              }
                                              isEnrollmentOpen={
                                                  Boolean(
                                                      data
                                                          ?.term
                                                          .isEnrollmentOpen,
                                                  )
                                              }
                                              isMutating={
                                                  isMutating
                                              }
                                              onEnroll={
                                                  handleEnroll
                                              }
                                          />
                                      ),
                                  )
                                : null}
                        </div>

                        <footer className="flex flex-col items-center gap-3 border-t border-neutral-200 px-4 py-4 sm:flex-row sm:justify-between sm:px-5">
                            <p className="text-xs text-neutral-500">
                                Showing{" "}
                                {data
                                    ?.availableSections
                                    .length ??
                                    0}{" "}
                                of{" "}
                                {data
                                    ?.pagination
                                    .totalItems ??
                                    0}{" "}
                                available courses
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={
                                        !data ||
                                        isLoading ||
                                        data
                                            .pagination
                                            .page <=
                                            1
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
                                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#35822E] px-3 text-sm font-semibold text-white">
                                    {data
                                        ?.pagination
                                        .page ??
                                        1}
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
                                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 text-sm disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </section>
                ) : null}
            </div>

                {actionNotification ? (
                <div
                    role={
                        actionNotification.type ===
                        "SUCCESS"
                            ? "status"
                            : "alert"
                    }
                    aria-live={
                        actionNotification.type ===
                        "SUCCESS"
                            ? "polite"
                            : "assertive"
                    }
                    className={[
                        "fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-white p-4 shadow-2xl sm:right-6 sm:top-6",
                        actionNotification.type ===
                        "SUCCESS"
                            ? "border-green-200"
                            : "border-red-200",
                    ].join(" ")}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={[
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                actionNotification.type ===
                                "SUCCESS"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                            ].join(" ")}
                        >
                            {actionNotification.type ===
                            "SUCCESS" ? (
                                <CircleCheck className="h-5 w-5" />
                            ) : (
                                <CircleAlert className="h-5 w-5" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-neutral-900">
                                {actionNotification.title}
                            </h2>
                            <p className="mt-1 text-sm leading-5 text-neutral-600">
                                {actionNotification.message}
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="Close notification"
                            onClick={() => {
                                setActionNotification(
                                    null,
                                );
                            }}
                            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : null}
        </PageContainer>
    );
}