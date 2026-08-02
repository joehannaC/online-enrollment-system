"use client";

import {
    GraduationCap,
    UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Button,
    LoadingSkeleton,
    ServiceUnavailable,
    StatusBadge,
} from "@/components/common";
import {
    PageContainer,
    ProfileHeader,
} from "@/components/layout";
import {
    ChangePasswordModal,
} from "@/components/profile";
import {
    getMyProfile,
    ProfileApiError,
} from "@/lib/api/profileApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import {
    getStudentRecords,
} from "@/lib/api/studentRecordApi";
import type {
    StudentProfileData,
    StudentRecordSummary,
} from "@/types";

interface InformationRowProps {
    label: string;
    value: string | number;
}

function InformationRow({
    label,
    value,
}: InformationRowProps) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {label}
            </dt>

            <dd className="mt-1 text-sm font-medium text-neutral-900">
                {value}
            </dd>
        </div>
    );
}

function formatBirthday(
    birthday?: string,
): string {
    if (!birthday) {
        return "Not provided";
    }

    const date = new Date(birthday);

    if (Number.isNaN(date.getTime())) {
        return birthday;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            day: "2-digit",
            year: "numeric",
        },
    ).format(date);
}

export default function StudentProfilePage() {
    const router = useRouter();

    const [
        academicSummary,
        setAcademicSummary,
    ] =
        useState<StudentRecordSummary | null>(
            null,
        );

    const [
        student,
        setStudent,
    ] = useState<StudentProfileData | null>(
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

    const [
        isPasswordModalOpen,
        setIsPasswordModalOpen,
    ] = useState(false);

    const loadProfile = useCallback(
        async (
            signal?: AbortSignal,
        ): Promise<void> => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const [
                    response,
                    recordsResponse,
                ] = await Promise.all([
                    getMyProfile(signal),

                    getStudentRecords(
                        {
                            page: 1,
                            limit: 1,
                        },
                        signal,
                    ),
                ]);

                if (
                    response.profile.role !==
                    "STUDENT"
                ) {
                    router.replace(
                        "/faculty/profile",
                    );

                    return;
                }

                setStudent(
                    response.profile,
                );
                setAcademicSummary(
                    recordsResponse.summary,
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
                        ProfileApiError &&
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
                        ProfileApiError &&
                    error.status === 403
                ) {
                    router.replace(
                        "/faculty/profile",
                    );

                    return;
                }

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "The student profile could not be loaded.",
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

        void loadProfile(
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [loadProfile]);

    useEffect(() => {
        function refreshProfile(): void {
            if (
                document.visibilityState ===
                "visible"
            ) {
                void loadProfile();
            }
        }

        window.addEventListener(
            "focus",
            refreshProfile,
        );

        document.addEventListener(
            "visibilitychange",
            refreshProfile,
        );

        return () => {
            window.removeEventListener(
                "focus",
                refreshProfile,
            );

            document.removeEventListener(
                "visibilitychange",
                refreshProfile,
            );
        };
    }, [loadProfile]);

    if (
        errorMessage &&
        !student
    ) {
        return (
            <ServiceUnavailable
                serviceName="Profile Service"
                title="Profile unavailable"
                description={
                    errorMessage
                }
                onRetry={() => {
                    void loadProfile();
                }}
            />
        );
    }

    return (
        <>
            <PageContainer>
                <div className="space-y-5">
                    <ProfileHeader
                        name={
                            student?.fullName ??
                            "Student"
                        }
                        subtitle="View your personal and academic information."
                        actions={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setIsPasswordModalOpen(
                                        true,
                                    )
                                }
                                className="border-white bg-white text-[#35822E] hover:bg-neutral-100"
                            >
                                Change Password
                            </Button>
                        }
                    />

                    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                        <header className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-lg font-semibold text-[#35822E]">
                                    Profile Overview
                                </h1>

                                <p className="mt-1 text-sm text-neutral-500">
                                    Personal and academic account information.
                                </p>
                            </div>

                            {student ? (
                                <StatusBadge
                                    status={
                                        student.status
                                    }
                                    dot
                                />
                            ) : null}
                        </header>

                        {isLoading ||
                        !student ? (
                            <StudentProfileSkeleton />
                        ) : (
                            <div className="p-5">
                                <section>
                                    <div className="flex items-center gap-2 border-l-4 border-[#35822E] pl-3">
                                        <UserRound className="h-5 w-5 text-[#35822E]" />

                                        <h2 className="font-semibold text-[#35822E]">
                                            Personal Information
                                        </h2>
                                    </div>

                                    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                        <InformationRow
                                            label="Full Name"
                                            value={
                                                student.fullName
                                            }
                                        />

                                        <InformationRow
                                            label="Student Number"
                                            value={
                                                student.studentNumber
                                            }
                                        />

                                        <InformationRow
                                            label="Email"
                                            value={
                                                student.email
                                            }
                                        />

                                        <InformationRow
                                            label="Birthday"
                                            value={formatBirthday(
                                                student.birthday,
                                            )}
                                        />

                                        <InformationRow
                                            label="Address"
                                            value={
                                                student.address ??
                                                "Not provided"
                                            }
                                        />

                                        <InformationRow
                                            label="Account Status"
                                            value={
                                                student.status
                                            }
                                        />
                                    </dl>
                                </section>

                                <div className="my-7 border-t border-neutral-200" />

                                <section>
                                    <div className="flex items-center gap-2 border-l-4 border-[#35822E] pl-3">
                                        <GraduationCap className="h-5 w-5 text-[#35822E]" />

                                        <h2 className="font-semibold text-[#35822E]">
                                            Academic Information
                                        </h2>
                                    </div>

                                    <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                        <InformationRow
                                            label="Program"
                                            value={
                                                student.programName
                                            }
                                        />

                                        <InformationRow
                                            label="Program Code"
                                            value={
                                                student.programCode
                                            }
                                        />

                                        <InformationRow
                                            label="Curriculum"
                                            value={
                                                student.curriculumCode
                                            }
                                        />

                                        <InformationRow
                                            label="College"
                                            value={
                                                student.college
                                            }
                                        />

                                        <InformationRow
                                            label="Campus"
                                            value={
                                                student.campus
                                            }
                                        />

                                        <InformationRow
                                            label="Year Level"
                                            value={`Year ${student.yearLevel}`}
                                        />

                                        <InformationRow
                                            label="Required Units"
                                            value={
                                                student.requiredUnits
                                            }
                                        />

                                        <InformationRow
                                            label="Required Non-Academic Units"
                                            value={
                                                student.requiredNonAcademicUnits
                                            }
                                        />

                                        <InformationRow
                                            label="Earned Units"
                                            value={
                                                academicSummary
                                                    ?.earnedUnits ??
                                                student.earnedUnits
                                            }
                                        />

                                        <InformationRow
                                            label="Earned Non-Academic Units"
                                            value={
                                                academicSummary
                                                    ?.earnedNonAcademicUnits ??
                                                student.earnedNonAcademicUnits
                                            }
                                        />

                                        <InformationRow
                                            label="Remaining Units"
                                            value={
                                                academicSummary
                                                    ?.remainingUnits ??
                                                student.remainingUnits
                                            }
                                        />

                                        <InformationRow
                                            label="Enrolled Units"
                                            value={
                                                academicSummary
                                                    ?.enrolledUnits ??
                                                student.enrolledUnits
                                            }
                                        />

                                            {/*<InformationRow
                                            label="Enlisted Units"
                                            value={
                                                student.enlistedUnits
                                            }
                                        />*/}
                                    </dl>
                                </section>
                            </div>
                        )}
                    </section>
                </div>
            </PageContainer>

            <ChangePasswordModal
                isOpen={
                    isPasswordModalOpen
                }
                onClose={() =>
                    setIsPasswordModalOpen(
                        false,
                    )
                }
            />
        </>
    );
}

function StudentProfileSkeleton() {
    return (
        <div className="space-y-8 p-5">
            <section>
                <LoadingSkeleton className="h-5 w-44" />

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({
                        length: 6,
                    }).map(
                        (_, index) => (
                            <div key={index}>
                                <LoadingSkeleton className="h-3 w-24" />

                                <LoadingSkeleton className="mt-2 h-5 w-40" />
                            </div>
                        ),
                    )}
                </div>
            </section>

            <LoadingSkeleton className="h-px w-full" />

            <section>
                <LoadingSkeleton className="h-5 w-44" />

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({
                        length: 13,
                    }).map(
                        (_, index) => (
                            <div key={index}>
                                <LoadingSkeleton className="h-3 w-24" />

                                <LoadingSkeleton className="mt-2 h-5 w-40" />
                            </div>
                        ),
                    )}
                </div>
            </section>
        </div>
    );
}