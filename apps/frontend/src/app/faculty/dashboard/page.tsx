"use client";

import {
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    RefreshCw,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import {
    Button,
    LoadingSkeleton,
    ServiceUnavailable,
    StatusBadge,
} from "@/components/common";
import {
    FacultySummary,
} from "@/components/faculty";
import {
    DashboardHeader,
    PageContainer,
} from "@/components/layout";
import {
    FacultyApiError,
    getFacultyDashboard,
} from "@/lib/api/facultyApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import type {
    FacultyDashboardResponse,
    FacultySubject,
} from "@/types";

function formatDeadlineDate(
    value: string,
): string {
    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
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

function formatSchedule(
    subject: FacultySubject,
): string {
    if (
        subject.schedule.length ===
        0
    ) {
        return "TBA";
    }

    return subject.schedule
        .map((schedule) => {
            const days =
                schedule.days.join(
                    "/",
                );

            const time =
                schedule.startTime &&
                schedule.endTime
                    ? `${schedule.startTime}–${schedule.endTime}`
                    : "";

            return [
                days,
                time,
                schedule.room,
            ]
                .filter(Boolean)
                .join(" • ");
        })
        .join(", ");
}

function formatGrade(
    value:
        | number
        | null
        | undefined,
): string {
    if (
        typeof value !==
            "number" ||
        !Number.isFinite(value)
    ) {
        return "Pending";
    }

    return value.toFixed(1);
}
export default function FacultyDashboardPage() {
    const router = useRouter();

    const [
        dashboard,
        setDashboard,
    ] =
        useState<FacultyDashboardResponse | null>(
            null,
        );

    const [
        selectedSubject,
        setSelectedSubject,
    ] =
        useState<FacultySubject | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const loadDashboard =
        useCallback(
            async (
                signal?: AbortSignal,
            ): Promise<void> => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const response =
                        await getFacultyDashboard(
                            signal,
                        );

                    setDashboard(
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
                            : "The faculty dashboard could not be loaded.",
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

        void loadDashboard(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [
        loadDashboard,
    ]);

    if (
        errorMessage &&
        !dashboard
    ) {
        return (
            <ServiceUnavailable
                serviceName="Grade Service"
                title="Faculty dashboard unavailable"
                description={
                    errorMessage
                }
                onRetry={() => {
                    void loadDashboard();
                }}
            />
        );
    }

    const facultyName =
        dashboard?.faculty.fullName ??
        "Faculty Member";

    const currentTermLabel =
        dashboard
            ? `${dashboard.currentTerm.name}, A.Y. ${dashboard.currentTerm.academicYear}`
            : "the current academic term";

    return (
        <PageContainer>
            <div className="space-y-5">
                <DashboardHeader
                    title={`Welcome, ${facultyName}!`}
                    description={`Manage your classes and submit student grades for ${currentTermLabel}.`}
                    badge={
                        <span className="rounded-full border border-white/70 px-4 py-1.5 text-xs font-semibold">
                            Faculty Portal
                        </span>
                    }
                    actions={
                        errorMessage ? (
                            <Button
                                size="sm"
                                variant="outline"
                                leftIcon={
                                    RefreshCw
                                }
                                onClick={() => {
                                    void loadDashboard();
                                }}
                                className="border-white bg-white text-[#35822E] hover:bg-neutral-100"
                            >
                                Refresh
                            </Button>
                        ) : undefined
                    }
                />

                {isLoading ||
                !dashboard ? (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({
                            length: 4,
                        }).map(
                            (_, index) => (
                                <div
                                    key={
                                        index
                                    }
                                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                                >
                                    <LoadingSkeleton className="h-4 w-32" />
                                    <LoadingSkeleton className="mt-4 h-8 w-20" />
                                    <LoadingSkeleton className="mt-3 h-3 w-28" />
                                </div>
                            ),
                        )}
                    </section>
                ) : (
                    <FacultySummary
                        summary={
                            dashboard.summary
                        }
                    />
                )}

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                        <header className="border-b border-neutral-200 px-5 py-4">
                            <h2 className="text-lg font-semibold text-[#35822E]">
                                Handled Subjects
                            </h2>

                            <p className="mt-1 text-sm text-neutral-500">
                                Each section with at least one successfully enrolled student is shown separately.
                            </p>
                        </header>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] border-collapse text-sm">
                                <thead className="bg-[#35822E]/35 text-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Subject
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            Schedule
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Students
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Grades
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
                                                    5
                                                }
                                                className="px-4 py-12 text-center text-neutral-500"
                                            >
                                                Loading handled subjects...
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading &&
                                    (dashboard
                                        ?.handledSubjects
                                        .length ??
                                        0) ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    5
                                                }
                                                className="px-4 py-12 text-center text-neutral-500"
                                            >
                                                No sections currently have successfully enrolled students.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {!isLoading
                                        ? dashboard?.handledSubjects.map(
                                              (
                                                  subject,
                                              ) => (
                                                  <tr
                                                      key={
                                                          subject.sectionId
                                                      }
                                                      className="border-b border-neutral-200 last:border-b-0"
                                                  >
                                                      <td className="px-4 py-4">
                                                          <p className="font-semibold text-neutral-900">
                                                              {
                                                                  subject.courseName
                                                              }
                                                          </p>
                                                          <p className="mt-1 text-xs font-medium text-neutral-500">
                                                              {
                                                                  subject.courseCode
                                                              }{" "}
                                                              •{" "}
                                                              {
                                                                  subject.sectionCode
                                                              }
                                                          </p>
                                                      </td>

                                                      <td className="px-4 py-4 text-neutral-700">
                                                          {formatSchedule(
                                                              subject,
                                                          )}
                                                      </td>

                                                      <td className="px-4 py-4 text-center font-semibold text-neutral-800">
                                                          {
                                                              subject.enrolledStudents
                                                          }
                                                      </td>

                                                      <td className="px-4 py-4 text-center">
                                                          <span
                                                              className={[
                                                                  "inline-flex min-w-[84px] justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                                                                  subject.pendingGrades ===
                                                                  0
                                                                      ? "border-green-300 bg-green-50 text-green-700"
                                                                      : "border-amber-300 bg-amber-50 text-amber-700",
                                                              ].join(
                                                                  " ",
                                                              )}
                                                          >
                                                              {
                                                                  subject.gradedStudents
                                                              }
                                                              /
                                                              {
                                                                  subject.enrolledStudents
                                                              }
                                                          </span>
                                                      </td>

                                                      <td className="px-4 py-4 text-center">
                                                        {subject.submissionStatus ===
                                                            "SUBMITTED" ||
                                                        subject.submissionStatus ===
                                                            "VERIFIED" ? (
                                                            <Button
                                                                size="sm"
                                                                className="min-w-[120px]"
                                                                onClick={() => {
                                                                    setSelectedSubject(
                                                                        subject,
                                                                    );
                                                                }}
                                                            >
                                                                View Grades
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                className="min-w-[120px]"
                                                                onClick={() => {
                                                                    router.push(
                                                                        `/faculty/grade-entry?sectionId=${encodeURIComponent(
                                                                            subject.sectionId,
                                                                        )}`,
                                                                    );
                                                                }}
                                                            >
                                                                Input Grades
                                                            </Button>
                                                        )}
                                                    </td>
                                                  </tr>
                                              ),
                                          )
                                        : null}
                                </tbody>
                            </table>
                        </div>
                    </article>

                    <div className="space-y-5">
                        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                            <header className="border-b border-neutral-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-[#35822E]" />
                                    <h2 className="text-lg font-semibold text-[#35822E]">
                                        Grade Submission
                                    </h2>
                                </div>
                            </header>

                            <div className="p-5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">
                                        Completion
                                    </span>
                                    <span className="font-semibold text-[#35822E]">
                                        {dashboard
                                            ?.summary
                                            .submissionPercentage ??
                                            0}
                                        %
                                    </span>
                                </div>

                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-200">
                                    <div
                                        className="h-full bg-[#35822E] transition-[width] duration-500"
                                        style={{
                                            width: `${Math.min(
                                                dashboard
                                                    ?.summary
                                                    .submissionPercentage ??
                                                    0,
                                                100,
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <p className="mt-3 text-xs text-neutral-500">
                                    {dashboard
                                        ?.summary
                                        .pendingGradeCount ??
                                        0}{" "}
                                    students still require complete grades.
                                </p>

                                <Button
                                    fullWidth
                                    className="mt-5"
                                    onClick={() =>
                                        router.push(
                                            "/faculty/grade-entry",
                                        )
                                    }
                                >
                                    Continue Grade Entry
                                </Button>
                            </div>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                            <header className="border-b border-neutral-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className="h-5 w-5 text-[#35822E]" />
                                    <h2 className="text-lg font-semibold text-[#35822E]">
                                        Upcoming Deadlines
                                    </h2>
                                </div>
                            </header>

                            <div className="divide-y divide-neutral-100 px-5">
                                {dashboard?.upcomingDeadlines.map(
                                    (
                                        deadline,
                                    ) => (
                                        <article
                                            key={
                                                deadline.id
                                            }
                                            className="py-4"
                                        >
                                            <div className="flex items-start gap-3">
                                                <AlertCircle
                                                    className={[
                                                        "mt-0.5 h-4 w-4 shrink-0",
                                                        deadline.status ===
                                                        "OVERDUE"
                                                            ? "text-red-600"
                                                            : deadline.status ===
                                                                "DUE_SOON"
                                                              ? "text-amber-600"
                                                              : "text-[#35822E]",
                                                    ].join(
                                                        " ",
                                                    )}
                                                />

                                                <div>
                                                    <h3 className="text-sm font-semibold text-neutral-900">
                                                        {
                                                            deadline.title
                                                        }
                                                    </h3>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {formatDeadlineDate(
                                                            deadline.deadline,
                                                        )}
                                                    </p>
                                                    <div className="mt-2">
                                                        <StatusBadge
                                                            variant={
                                                                deadline.status ===
                                                                "OVERDUE"
                                                                    ? "danger"
                                                                    : deadline.status ===
                                                                        "DUE_SOON"
                                                                      ? "warning"
                                                                      : "primary"
                                                            }
                                                        >
                                                            {deadline.status ===
                                                            "OVERDUE"
                                                                ? `${Math.abs(
                                                                      deadline.daysRemaining,
                                                                  )} days overdue`
                                                                : `${deadline.daysRemaining} days remaining`}
                                                        </StatusBadge>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ),
                                )}
                            </div>
                        </article>

                        {/*<Button
                            fullWidth
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    "/faculty/records",
                                )
                            }
                        >
                            View Grade Records
                        </Button>*/}
                    </div>
                </section>
            </div>

            {selectedSubject ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="grade-review-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    onClick={() => {
                        setSelectedSubject(
                            null,
                        );
                    }}
                >
                    <section
                        className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(
                            event,
                        ) => {
                            event.stopPropagation();
                        }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                            <div>
                                <h2
                                    id="grade-review-title"
                                    className="text-xl font-semibold text-[#35822E]"
                                >
                                    Grade Summary
                                </h2>
                                <p className="mt-1 text-sm text-neutral-600">
                                    {
                                        selectedSubject.courseCode
                                    }{" "}
                                    •{" "}
                                    {
                                        selectedSubject.sectionCode
                                    }{" "}
                                    —{" "}
                                    {
                                        selectedSubject.courseName
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close grade summary"
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
                                    {selectedSubject.students.map(
                                        (
                                            student,
                                        ) => (
                                            <tr
                                                key={
                                                    student.studentId
                                                }
                                                className="border-b border-neutral-200"
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
                                                <td className="px-4 py-3 text-center font-medium text-neutral-900">
                                                    {formatGrade(
                                                        student.activity,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-center font-medium text-neutral-900">
                                                    {formatGrade(
                                                        student.majorOutput1,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-center font-medium text-neutral-900">
                                                    {formatGrade(
                                                        student.majorOutput2,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-center font-medium text-neutral-900">
                                                    {formatGrade(
                                                        student.midtermExam,
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-center font-medium text-neutral-900">
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