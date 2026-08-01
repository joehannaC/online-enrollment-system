"use client";

import {
    ArrowLeft,
    CircleAlert,
    CircleCheck,
    Pencil,
    X,
} from "lucide-react";
import Link from "next/link";
import {
    useRouter,
} from "next/navigation";
import {
    useEffect,
    useState,
} from "react";

import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
    LoadingSkeleton,
    ServiceUnavailable,
} from "@/components/common";
import PageContainer from "@/components/layout/PageContainer";
import {
    getStudentEnrollment,
    StudentEnrollmentApiError,
    submitStudentEnrollment,
} from "@/lib/api/studentEnrollmentApi";
import type {
    StudentEnrollmentResponse,
} from "@/types";

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

type SubmissionNotification = {
    type: "SUCCESS" | "ERROR";
    title: string;
    message: string;
};

function getSubmissionErrorNotification(
    error: StudentEnrollmentApiError,
): SubmissionNotification {
    switch (error.code) {
        case "SECTION_FULL":
        case "ENROLLMENT_SECTION_FULL":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "A selected section is already full. Please enroll in another open section.",
            };

        case "MAXIMUM_UNITS_EXCEEDED":
        case "MAXIMUM_LOAD_EXCEEDED":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "The maximum academic unit limit has been reached. Remove a course before submitting again.",
            };

        case "ENROLLMENT_VERSION_CONFLICT":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "Your enrollment changed in another tab. The latest enrollment details have been reloaded.",
            };

        case "ENROLLMENT_PERIOD_CLOSED":
        case "ENROLLMENT_CLOSED":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "The enrollment period has already ended.",
            };

        case "ENROLLMENT_ALREADY_SUBMITTED":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "This enrollment has already been submitted.",
            };

        case "ENROLLMENT_SERVICE_BUSY":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "The Enrollment Service is handling a high volume of requests. Please try again.",
            };

        case "ENROLLMENT_SERVICE_UNAVAILABLE":
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    "The Enrollment Service is currently unavailable. Please try again later.",
            };

        default:
            return {
                type: "ERROR",
                title: "Submission unsuccessful",
                message:
                    error.message ||
                    "The enrollment could not be submitted. Please review your selected sections and try again.",
            };
    }
}

export default function EnrollmentSummaryPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<StudentEnrollmentResponse | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [
        isSubmitModalOpen,
        setIsSubmitModalOpen,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        submissionNotification,
        setSubmissionNotification,
    ] =
        useState<SubmissionNotification | null>(
            null,
        );

    async function loadSummary(): Promise<void> {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const result =
                await getStudentEnrollment({
                    page: 1,
                    limit: 100,
                });

            setData(result);
        } catch (error) {
            if (
                error instanceof
                StudentEnrollmentApiError
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
                "The enrollment summary could not be loaded.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadSummary();
    }, []);

    useEffect(() => {
        if (!submissionNotification) {
            return;
        }

        const timeout =
            window.setTimeout(() => {
                setSubmissionNotification(
                    null,
                );
            }, 5000);

        return () => {
            window.clearTimeout(
                timeout,
            );
        };
    }, [
        submissionNotification,
    ]);

    async function confirmSubmission(): Promise<void> {
        if (
            !data ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSubmissionNotification(
            null,
        );

        try {
            const result =
                await submitStudentEnrollment(
                    data.enrollment.version,
                );

            setIsSubmitModalOpen(
                false,
            );

            await loadSummary();

            if (
                result.outcome ===
                "PARTIAL_SUCCESS"
            ) {
                setSubmissionNotification({
                    type: "SUCCESS",
                    title:
                        "Enrollment partially successful",
                    message:
                        result.message,
                });

                return;
            }

            if (
                result.outcome ===
                "ALL_SECTIONS_FULL"
            ) {
                setSubmissionNotification({
                    type: "ERROR",
                    title:
                        "Submission unsuccessful",
                    message:
                        result.message,
                });

                return;
            }

            setSubmissionNotification({
                type: "SUCCESS",
                title:
                    "Enrollment successful",
                message:
                    result.message,
            });
        } catch (error) {
            setIsSubmitModalOpen(
                false,
            );

            if (
                error instanceof
                StudentEnrollmentApiError
            ) {
                setSubmissionNotification(
                    getSubmissionErrorNotification(
                        error,
                    ),
                );

                if (
                    error.code ===
                        "ENROLLMENT_VERSION_CONFLICT" ||
                    error.code ===
                        "SECTION_FULL"
                ) {
                    await loadSummary();
                }

                return;
            }

            setSubmissionNotification({
                type: "ERROR",
                title:
                    "Submission unsuccessful",
                message:
                    "The enrollment could not be submitted. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const submitted =
        data?.enrollment.status ===
        "SUBMITTED";

    const canEdit =
        Boolean(
            data?.term
                .isEnrollmentOpen &&
                !submitted &&
                data.enrollment.items
                    .length > 0,
        );

    const canSubmit =
        Boolean(
            data?.term
                .isEnrollmentOpen &&
                !submitted &&
                data.enrollment.items
                    .length > 0,
        );


    if (
        isLoading &&
        !data
    ) {
        return (
            <PageContainer>
                <div className="mx-auto w-full max-w-[1440px] space-y-5">
                    <header>
                        <LoadingSkeleton className="h-5 w-20" />
                        <LoadingSkeleton className="mt-4 h-10 w-56" />
                        <LoadingSkeleton className="mt-3 h-4 w-80 max-w-full" />
                    </header>

                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                                <LoadingSkeleton className="h-5 w-48" />
                                <div className="flex gap-5">
                                    <LoadingSkeleton className="h-4 w-28" />
                                    <LoadingSkeleton className="h-4 w-28" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <LoadingSkeleton className="h-10 w-40 rounded-lg" />
                                <LoadingSkeleton className="h-10 w-40 rounded-lg" />
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-200 p-5">
                            <LoadingSkeleton className="h-6 w-48" />
                        </div>

                        <div className="space-y-4 p-5">
                            {Array.from({
                                length: 5,
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
            <PageContainer>
                <ServiceUnavailable
                    title="Enrollment summary unavailable"
                    description={errorMessage}
                    serviceName="Enrollment Service"
                    onRetry={() => {
                        void loadSummary();
                    }}
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <div className="mx-auto w-full max-w-[1440px] space-y-5">
                <header>
                    <Link
                        href="/student/enrollment"
                        className="
                            mb-3 inline-flex
                            items-center gap-2
                            text-sm font-semibold
                            text-neutral-700
                            transition
                            hover:text-[#35822E]
                        "
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>

                    <h1 className="font-serif text-3xl font-semibold text-[#35822E] sm:text-4xl">
                        Enrollment
                    </h1>

                    <p className="mt-1 text-sm text-neutral-600">
                        Review your selected
                        courses before final
                        submission.
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
                                        Enrolled:{" "}
                                        {
                                            data
                                                .enrollment
                                                .totalAcademicUnits
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
                                    Enrollment closes{" "}
                                    {formatDate(
                                        data.term
                                            .enrollmentEnd,
                                    )}
                                </p>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    {canEdit ? (
                                        <Link
                                            href="/student/enrollment/edit"
                                            className="
                                                inline-flex h-10
                                                items-center
                                                justify-center
                                                gap-2 rounded-lg
                                                border
                                                border-[#35822E]
                                                bg-white px-5
                                                text-sm font-semibold
                                                text-[#35822E]
                                                transition
                                                hover:bg-green-50
                                            "
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Enrollment
                                        </Link>
                                    ) : null}

                                    {canSubmit ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSubmitModalOpen(
                                                    true,
                                                );
                                            }}
                                            className="
                                                h-10 rounded-lg
                                                bg-[#35822E]
                                                px-5 text-sm
                                                font-semibold
                                                text-white
                                                transition
                                                hover:bg-[#2B6D26]
                                            "
                                        >
                                            Submit Enrollment
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                {submitted ? (
                    <div
                        role="status"
                        className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                    >
                        Your enrollment has been submitted and can no longer be changed.
                    </div>
                ) : null}

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
                        <h2 className="text-lg font-semibold text-[#35822E]">
                            Enrollment Summary
                        </h2>
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
                                            className="px-4 py-16 text-center text-neutral-500"
                                        >
                                            Loading enrollment summary...
                                        </td>
                                    </tr>
                                ) : null}

                                {!isLoading &&
                                data?.enrollment
                                    .items.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={
                                                6
                                            }
                                            className="px-4 py-16 text-center text-neutral-500"
                                        >
                                            No courses have been selected.
                                        </td>
                                    </tr>
                                ) : null}

                                {!isLoading
                                    ? data?.enrollment.items.map(
                                          (
                                              item,
                                          ) => (
                                              <tr
                                                  key={
                                                      item.itemId
                                                  }
                                                  className="border-b border-neutral-200 last:border-b-0"
                                              >
                                                  <td className="px-4 py-4 font-medium text-neutral-900">
                                                      {
                                                          item.courseName
                                                      }
                                                  </td>
                                                  <td className="px-4 py-4 text-center font-medium text-neutral-800">
                                                      {
                                                          item.courseCode
                                                      }
                                                  </td>
                                                  <td className="px-4 py-4 text-center font-semibold text-neutral-800">
                                                      {
                                                          item.academicUnits
                                                      }
                                                  </td>
                                                  <td className="px-4 py-4 text-neutral-700">
                                                      {
                                                          item.scheduleLabel
                                                      }
                                                  </td>
                                                  <td className="px-4 py-4 text-neutral-700">
                                                      {
                                                          item.instructorName
                                                      }
                                                  </td>
                                                  <td className="px-4 py-4 text-center">
                                                      <span
                                                          className={[
                                                              "inline-flex min-w-[108px] justify-center rounded-lg px-4 py-2 text-xs font-semibold",
                                                              submitted
                                                                  ? "bg-[#35822E] text-white"
                                                                  : "bg-green-50 text-[#35822E]",
                                                          ].join(
                                                              " ",
                                                          )}
                                                      >
                                                          {submitted
                                                              ? "Enrolled"
                                                              : "Selected"}
                                                      </span>
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
                            ? data?.enrollment.items.map(
                                  (
                                      item,
                                  ) => (
                                      <article
                                          key={
                                              item.itemId
                                          }
                                          className="rounded-xl border border-neutral-200 p-4"
                                      >
                                          <div className="flex items-start justify-between gap-3">
                                              <div>
                                                  <h3 className="font-semibold text-neutral-900">
                                                      {
                                                          item.courseName
                                                      }
                                                  </h3>
                                                  <p className="mt-1 text-sm font-medium text-[#35822E]">
                                                      {
                                                          item.courseCode
                                                      }
                                                  </p>
                                              </div>

                                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#35822E]">
                                                  {submitted
                                                      ? "Enrolled"
                                                      : "Selected"}
                                              </span>
                                          </div>

                                          <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                                              <div>
                                                  <dt className="text-xs text-neutral-500">
                                                      Units
                                                  </dt>
                                                  <dd className="mt-1 font-semibold text-neutral-800">
                                                      {
                                                          item.academicUnits
                                                      }
                                                  </dd>
                                              </div>

                                              <div>
                                                  <dt className="text-xs text-neutral-500">
                                                      Schedule
                                                  </dt>
                                                  <dd className="mt-1 text-neutral-800">
                                                      {
                                                          item.scheduleLabel
                                                      }
                                                  </dd>
                                              </div>

                                              <div>
                                                  <dt className="text-xs text-neutral-500">
                                                      Instructor
                                                  </dt>
                                                  <dd className="mt-1 text-neutral-800">
                                                      {
                                                          item.instructorName
                                                      }
                                                  </dd>
                                              </div>
                                          </dl>
                                      </article>
                                  ),
                              )
                            : null}
                    </div>
                </section>
            </div>

            {submissionNotification ? (
                <div
                    role={
                        submissionNotification.type ===
                        "SUCCESS"
                            ? "status"
                            : "alert"
                    }
                    aria-live={
                        submissionNotification.type ===
                        "SUCCESS"
                            ? "polite"
                            : "assertive"
                    }
                    className={[
                        `
                            fixed right-4 top-4 z-50
                            w-[calc(100%-2rem)]
                            max-w-sm rounded-xl
                            border bg-white p-4
                            shadow-2xl
                            sm:right-6 sm:top-6
                        `,
                        submissionNotification.type ===
                        "SUCCESS"
                            ? "border-green-200"
                            : "border-red-200",
                    ].join(" ")}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={[
                                `
                                    mt-0.5 flex
                                    h-9 w-9 shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                `,
                                submissionNotification.type ===
                                "SUCCESS"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                            ].join(" ")}
                        >
                            {submissionNotification.type ===
                            "SUCCESS" ? (
                                <CircleCheck
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                />
                            ) : (
                                <CircleAlert
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-neutral-900">
                                {
                                    submissionNotification.title
                                }
                            </h2>

                            <p className="mt-1 text-sm leading-5 text-neutral-600">
                                {
                                    submissionNotification.message
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="Close notification"
                            onClick={() => {
                                setSubmissionNotification(
                                    null,
                                );
                            }}
                            className="
                                rounded-lg p-1
                                text-neutral-400
                                transition
                                hover:bg-neutral-100
                                hover:text-neutral-700
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#35822E]/30
                            "
                        >
                            <X
                                aria-hidden="true"
                                className="h-4 w-4"
                            />
                        </button>
                    </div>
                </div>
            ) : null}

            <ConfirmationModal
                isOpen={
                    isSubmitModalOpen
                }
                title="Submit enrollment?"
                description="Please review all selected courses carefully. Once submitted, your enrollment will be final and can no longer be changed."
                confirmLabel="Yes, submit"
                isLoading={
                    isSubmitting
                }
                onClose={() => {
                    if (!isSubmitting) {
                        setIsSubmitModalOpen(
                            false,
                        );
                    }
                }}
                onConfirm={() => {
                    void confirmSubmission();
                }}
            />
        </PageContainer>
    );
}