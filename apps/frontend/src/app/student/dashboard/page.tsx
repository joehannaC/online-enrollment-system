"use client";

import {
    CalendarDays,
    RefreshCw,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import {
    Button,
    ServiceUnavailable,
} from "@/components/common";
import {
    DashboardHeader,
    PageContainer,
} from "@/components/layout";
import {
    AnnouncementList,
    RegisteredCourses,
    TodaySchedule,
} from "@/components/student";
import {
    getStudentDashboard,
    StudentApiError,
} from "@/lib/api/studentApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import type {
    StudentDashboardResponse,
} from "@/types";

export default function StudentDashboardPage() {
    const router = useRouter();

    const [
        dashboard,
        setDashboard,
    ] =
        useState<StudentDashboardResponse | null>(
            null,
        );

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");

    async function loadDashboard(
        signal?: AbortSignal,
    ): Promise<void> {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const dashboardResponse =
                await getStudentDashboard(
                    signal,
                );

            setDashboard(
                dashboardResponse,
            );
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === "AbortError"
            ) {
                return;
            }

            if (
                error instanceof StudentApiError &&
                error.status === 401
            ) {
                clearAuthSession();
                router.replace("/login");
                return;
            }

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "The student dashboard could not be loaded.",
            );
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        const controller =
            new AbortController();

        void loadDashboard(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, []);

    if (errorMessage && !dashboard) {
        return (
            <ServiceUnavailable
                serviceName="Student Dashboard Service"
                title="Dashboard unavailable"
                description={errorMessage}
                onRetry={() => {
                    void loadDashboard();
                }}
            />
        );
    }

    const studentName =
        dashboard?.student.fullName ??
        "Student";

    const currentTermLabel = dashboard
        ? `${dashboard.currentTerm.name}, A.Y. ${dashboard.currentTerm.academicYear}`
        : "current academic term";

    return (
        <PageContainer>
            <div className="space-y-5">
                <DashboardHeader
                    title={`Welcome, ${studentName}!`}
                    description={`Here’s your academic overview for ${currentTermLabel}.`}
                    actions={
                        errorMessage ? (
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={
                                    RefreshCw
                                }
                                onClick={() => {
                                    void loadDashboard();
                                }}
                                className="border-white bg-white text-[#35822E]"
                            >
                                Refresh
                            </Button>
                        ) : undefined
                    }
                />

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <RegisteredCourses
                        courses={
                            dashboard
                                ?.registeredCourses ??
                            []
                        }
                        isLoading={
                            isLoading
                        }
                        showSchedule
                    />

                    <AnnouncementList
                        announcements={
                            dashboard
                                ?.announcements ??
                            []
                        }
                        isLoading={
                            isLoading
                        }
                    />
                </section>

                <TodaySchedule
                    schedule={
                        dashboard
                            ?.todaySchedule ??
                        []
                    }
                    isLoading={isLoading}
                />

                {!isLoading && dashboard ? (
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        
                    </section>
                ) : null}
            </div>
        </PageContainer>
    );
}