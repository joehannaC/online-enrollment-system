"use client";

import {
    ArrowLeft,
    CircleAlert,
    CircleCheck,
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
    removeEnrollmentDraftItem,
    StudentEnrollmentApiError,
} from "@/lib/api/studentEnrollmentApi";
import type {
    EnrollmentSummaryItem,
    StudentEnrollmentResponse,
} from "@/types";

type ActionNotification = {
    type: "SUCCESS" | "ERROR";
    title: string;
    message: string;
};

export default function EditEnrollmentPage() {
    const router = useRouter();

    const [
        data,
        setData,
    ] =
        useState<StudentEnrollmentResponse | null>(
            null,
        );

    const [
        selectedDropItem,
        setSelectedDropItem,
    ] =
        useState<EnrollmentSummaryItem | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isDropping,
        setIsDropping,
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

    async function loadEnrollment(): Promise<void> {
        setIsLoading(true);
        setErrorMessage("");

        try {
            const result =
                await getStudentEnrollment({
                    page: 1,
                    limit: 100,
                });

            if (
                result.enrollment
                    .status ===
                    "SUBMITTED" ||
                result.enrollment
                    .mode ===
                    "READ_ONLY"
            ) {
                router.replace(
                    "/student/enrollment/summary",
                );

                return;
            }

            setData(result);
        } catch (error) {
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
                "The enrollment could not be loaded.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadEnrollment();
    }, []);

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

    async function confirmDrop(): Promise<void> {
        if (
            !data ||
            !selectedDropItem ||
            isDropping
        ) {
            return;
        }

        setIsDropping(true);
        setErrorMessage("");
        setActionNotification(
            null,
        );

        try {
            await removeEnrollmentDraftItem(
                selectedDropItem.itemId,
                data.enrollment.version,
            );

            setSelectedDropItem(
                null,
            );

            await loadEnrollment();

            setActionNotification({
                type: "SUCCESS",
                title:
                    "Course removed",
                message:
                    "The selected course was removed from your enrollment draft.",
            });
        } catch (error) {
            if (
                error instanceof
                StudentEnrollmentApiError
            ) {
                setActionNotification({
                    type: "ERROR",
                    title:
                        "Removal unsuccessful",
                    message:
                        error.message,
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
                    "Removal unsuccessful",
                message:
                    "The selected course could not be removed.",
            });
        } finally {
            setIsDropping(false);
        }
    }


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
                        <LoadingSkeleton className="mt-3 h-4 w-72 max-w-full" />
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

                            <LoadingSkeleton className="h-10 w-40 rounded-lg" />
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                        <div className="border-b border-neutral-200 p-5">
                            <LoadingSkeleton className="h-6 w-40" />
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
                    title="Enrollment unavailable"
                    description={errorMessage}
                    serviceName="Enrollment Service"
                    onRetry={() => {
                        void loadEnrollment();
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
                        href="/student/enrollment/summary"
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
                        Remove courses from your
                        enrollment draft.
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

                            {/*<button
                                type="button"
                                onClick={() => {
                                    router.push(
                                        "/student/enrollment/summary",
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
                                Save Enrollment
                            </button>*/}
                        </div>
                    </section>
                ) : null}

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                    <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
                        <h2 className="text-lg font-semibold text-[#35822E]">
                            Edit Enrollment
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
                                        Action
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
                                            Loading selected courses...
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
                                                    {item.canDrop ? (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                isDropping
                                                            }
                                                            onClick={() => {
                                                                setSelectedDropItem(
                                                                    item,
                                                                );
                                                            }}
                                                            className="
                                                                h-9 min-w-[100px]
                                                                rounded-lg
                                                                bg-red-600
                                                                px-4 text-sm
                                                                font-semibold
                                                                text-white
                                                                transition
                                                                hover:bg-red-700
                                                                disabled:opacity-50
                                                            "
                                                        >
                                                            Drop
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                                            Enrolled
                                                        </span>
                                                    )}
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

                                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                                {
                                                    item.academicUnits
                                                }{" "}
                                                units
                                            </span>
                                        </div>

                                        <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
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

                                        {item.canDrop ? (
                                            <button
                                                type="button"
                                                disabled={
                                                    isDropping
                                                }
                                                onClick={() => {
                                                    setSelectedDropItem(
                                                        item,
                                                    );
                                                }}
                                                className="
                                                    mt-4 h-10
                                                    w-full rounded-lg
                                                    bg-red-600
                                                    text-sm font-semibold
                                                    text-white transition
                                                    hover:bg-red-700
                                                    disabled:opacity-50
                                                "
                                            >
                                                Drop
                                            </button>
                                        ) : (
                                            <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                                                Successfully enrolled
                                            </div>
                                        )}
                                    </article>
                                ),
                            )
                            : null}
                    </div>
                </section>
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

            <ConfirmationModal
                isOpen={
                    selectedDropItem !==
                    null
                }
                title="Drop this course?"
                description={
                    selectedDropItem
                        ? `${selectedDropItem.courseCode} — ${selectedDropItem.courseName} will be removed from your draft.`
                        : ""
                }
                confirmLabel="Yes, drop"
                variant="danger"
                isLoading={
                    isDropping
                }
                onClose={() => {
                    if (!isDropping) {
                        setSelectedDropItem(
                            null,
                        );
                    }
                }}
                onConfirm={() => {
                    void confirmDrop();
                }}
            />
        </PageContainer>
    );
}