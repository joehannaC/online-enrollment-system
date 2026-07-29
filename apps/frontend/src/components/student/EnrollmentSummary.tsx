"use client";

import {
    BookOpenCheck,
    CalendarDays,
    Trash2,
} from "lucide-react";

import {
    Button,
    EmptyState,
    StatusBadge,
} from "@/components/common";
import type {
    AcademicTermSummary,
    EnrollmentSelection,
} from "@/types";

interface EnrollmentSummaryProps {
    academicTerm?: AcademicTermSummary;
    selections: EnrollmentSelection[];
    maximumUnits?: number;
    isConfirming?: boolean;
    onRemove?: (
        sectionId: string,
    ) => void;
    onConfirm?: () => void;
    onGoBack?: () => void;
}

function formatSchedule(
    selection: EnrollmentSelection,
): string {
    return selection.schedule
        .map(
            (item) =>
                `${item.days.join("/")} ${item.startTime}–${item.endTime} • ${item.room}`,
        )
        .join(", ");
}

export default function EnrollmentSummary({
    academicTerm,
    selections,
    maximumUnits = 18,
    isConfirming = false,
    onRemove,
    onConfirm,
    onGoBack,
}: EnrollmentSummaryProps) {
    const totalUnits = selections.reduce(
        (sum, selection) =>
            sum + selection.units,
        0,
    );

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-5 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[#35822E]">
                            Enrollment Summary
                        </h2>

                        <p className="mt-1 text-sm text-neutral-500">
                            Review your selected courses
                            before confirming.
                        </p>
                    </div>

                    {academicTerm ? (
                        <StatusBadge variant="primary">
                            {academicTerm.name} • A.Y.{" "}
                            {
                                academicTerm.academicYear
                            }
                        </StatusBadge>
                    ) : null}
                </div>
            </header>

            {selections.length === 0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={BookOpenCheck}
                        title="No selected courses"
                        description="Select at least one open section before confirming enrollment."
                        action={
                            onGoBack ? (
                                <Button
                                    variant="outline"
                                    onClick={
                                        onGoBack
                                    }
                                >
                                    View Courses
                                </Button>
                            ) : undefined
                        }
                    />
                </div>
            ) : (
                <>
                    <div className="divide-y divide-neutral-100">
                        {selections.map(
                            (selection) => (
                                <article
                                    key={
                                        selection.sectionId
                                    }
                                    className="
                                        grid grid-cols-1
                                        gap-4 px-5 py-5
                                        md:grid-cols-[1fr_auto]
                                        md:items-center
                                    "
                                >
                                    <div>
                                        <h3 className="font-semibold text-neutral-900">
                                            {
                                                selection.courseName
                                            }
                                        </h3>

                                        <p className="mt-1 text-sm text-neutral-500">
                                            {
                                                selection.courseCode
                                            }{" "}
                                            • Section{" "}
                                            {
                                                selection.sectionCode
                                            }{" "}
                                            •{" "}
                                            {
                                                selection.units
                                            }{" "}
                                            units
                                        </p>

                                        <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                                            <span>
                                                {formatSchedule(
                                                    selection,
                                                )}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-neutral-500">
                                            Instructor:{" "}
                                            {
                                                selection.facultyName
                                            }
                                        </p>
                                    </div>

                                    {onRemove ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            leftIcon={
                                                Trash2
                                            }
                                            onClick={() =>
                                                onRemove(
                                                    selection.sectionId,
                                                )
                                            }
                                        >
                                            Remove
                                        </Button>
                                    ) : null}
                                </article>
                            ),
                        )}
                    </div>

                    <footer className="border-t border-neutral-200 bg-neutral-50 px-5 py-5">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="grid grid-cols-2 gap-6 sm:flex">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                                        Courses
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-[#35822E]">
                                        {
                                            selections.length
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                                        Total Units
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-[#35822E]">
                                        {totalUnits} /{" "}
                                        {maximumUnits}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                {onGoBack ? (
                                    <Button
                                        variant="outline"
                                        onClick={
                                            onGoBack
                                        }
                                    >
                                        Go Back to Courses
                                    </Button>
                                ) : null}

                                <Button
                                    isLoading={
                                        isConfirming
                                    }
                                    loadingText="Confirming..."
                                    disabled={
                                        totalUnits >
                                        maximumUnits
                                    }
                                    onClick={onConfirm}
                                >
                                    Confirm Enrollment
                                </Button>
                            </div>
                        </div>

                        {totalUnits > maximumUnits ? (
                            <p className="mt-3 text-sm text-red-600">
                                The selected courses
                                exceed the maximum allowed
                                units.
                            </p>
                        ) : null}
                    </footer>
                </>
            )}
        </section>
    );
}