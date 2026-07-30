"use client";

import {
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    RefreshCw,
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
    HandledSubjects,
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
} from "@/types";

function formatDeadlineDate(
    value: string,
): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
        },
    ).format(date);
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

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");

    const loadDashboard = useCallback(
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

                setDashboard(response);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }

                if (
                    error instanceof
                        FacultyApiError &&
                    error.status === 401
                ) {
                    clearAuthSession();
                    router.replace("/login");
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
                        : "The faculty dashboard could not be loaded.",
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

        void loadDashboard(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [loadDashboard]);

    if (errorMessage && !dashboard) {
        return (
            <ServiceUnavailable
                serviceName="Grade Service"
                title="Faculty dashboard unavailable"
                description={errorMessage}
                onRetry={() => {
                    void loadDashboard();
                }}
            />
        );
    }

    const facultyName =
        dashboard?.faculty.fullName ??
        "Faculty Member";

    const currentTermLabel = dashboard
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
                                    key={index}
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
                    <HandledSubjects
                        subjects={
                            dashboard
                                ?.handledSubjects ??
                            []
                        }
                        isLoading={
                            isLoading
                        }
                    />

                    <div className="space-y-5">
                        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                            <header className="border-b border-neutral-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-[#35822E]" />

                                    <h2 className="text-lg font-semibold text-[#35822E]">
                                        Grade Submission
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-neutral-500">
                                    Overall grading
                                    completion.
                                </p>
                            </header>

                            <div className="p-5">
                                {isLoading ? (
                                    <>
                                        <LoadingSkeleton className="h-4 w-32" />

                                        <LoadingSkeleton className="mt-4 h-3 w-full rounded-full" />

                                        <LoadingSkeleton className="mt-4 h-10 w-full" />
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-neutral-500">
                                                Completion
                                            </span>

                                            <span className="font-semibold text-[#35822E]">
                                                {
                                                    dashboard
                                                        ?.summary
                                                        .submissionPercentage ??
                                                    0
                                                }
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
                                            {
                                                dashboard
                                                    ?.summary
                                                    .pendingGradeCount ??
                                                0
                                            }{" "}
                                            grades still
                                            require input.
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
                                            Continue Grade
                                            Entry
                                        </Button>
                                    </>
                                )}
                            </div>
                        </article>

                        <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                            <header className="border-b border-neutral-200 px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className="h-5 w-5 text-[#35822E]" />

                                    <h2 className="text-lg font-semibold text-[#35822E]">
                                        Upcoming
                                        Deadlines
                                    </h2>
                                </div>
                            </header>

                            {isLoading ? (
                                <div className="space-y-4 p-5">
                                    {Array.from({
                                        length: 3,
                                    }).map(
                                        (
                                            _,
                                            index,
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="flex gap-3"
                                            >
                                                <LoadingSkeleton
                                                    rounded="full"
                                                    className="mt-1 h-3 w-3 shrink-0"
                                                />

                                                <div className="flex-1">
                                                    <LoadingSkeleton className="h-4 w-3/4" />

                                                    <LoadingSkeleton className="mt-2 h-3 w-1/2" />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : dashboard &&
                              dashboard
                                  .upcomingDeadlines
                                  .length > 0 ? (
                                <div className="divide-y divide-neutral-100 px-5">
                                    {dashboard.upcomingDeadlines.map(
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

                                                    <div className="min-w-0 flex-1">
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
                            ) : (
                                <div className="p-5 text-sm text-neutral-500">
                                    No upcoming
                                    deadlines.
                                </div>
                            )}
                        </article>

                        <Button
                            fullWidth
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    "/faculty/records",
                                )
                            }
                        >
                            View Grade Records
                        </Button>
                    </div>
                </section>
            </div>
        </PageContainer>
    );
}