"use client";

import {
    CheckCircle2,
    UserRound,
} from "lucide-react";

import {
    Input,
    StatusBadge,
} from "@/components/common";
import type {
    GradeComponents,
    GradeEntryStudent,
} from "@/types";

interface GradeEntryMobileCardProps {
    student:
        GradeEntryStudent;
    disabled?: boolean;
    errors?: Record<
        string,
        string
    >;
    onChange: (
        studentId: string,
        components:
            GradeComponents,
    ) => void;
}

function toNumberOrUndefined(
    value: string,
): number | undefined {
    if (
        value.trim() === ""
    ) {
        return undefined;
    }

    const parsed =
        Number(value);

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : undefined;
}

export default function GradeEntryMobileCard({
    student,
    disabled = false,
    errors = {},
    onChange,
}: GradeEntryMobileCardProps) {
    const fields: Array<{
        key:
            keyof GradeComponents;
        label: string;
    }> = [
        {
            key:
                "activitiesScore",
            label:
                "Activities 20%",
        },
        {
            key:
                "majorOutput1Score",
            label:
                "Major Output 1 20%",
        },
        {
            key:
                "majorOutput2Score",
            label:
                "Major Output 2 20%",
        },
        {
            key:
                "midtermExamScore",
            label:
                "Midterm Exam 20%",
        },
        {
            key:
                "finalExamScore",
            label:
                "Final Exam 20%",
        },
    ];

    const hasAnyInput =
        Object.values(
            student.components,
        ).some(
            (value) =>
                value !==
                undefined,
        );

    const displayStatus =
        student.status ===
        "SUBMITTED"
            ? "COMPLETE"
            : hasAnyInput
            ? "DRAFT"
            : "INCOMPLETE";


    function updateComponent(
        key:
            keyof GradeComponents,
        value: string,
    ): void {
        onChange(
            student.studentId,
            {
                ...student.components,
                [key]:
                    toNumberOrUndefined(
                        value,
                    ),
            },
        );
    }

    return (
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <header className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#35822E]/10 text-[#35822E]">
                        <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <h3 className="truncate font-semibold text-neutral-900">
                            {
                                student.fullName
                            }
                        </h3>

                        <p className="mt-1 text-xs text-neutral-500">
                            {
                                student.studentNumber
                            }
                        </p>
                    </div>
                </div>

                <StatusBadge
                    variant={
                        displayStatus ===
                        "COMPLETE"
                            ? "success"
                            : displayStatus ===
                                "DRAFT"
                            ? "primary"
                            : "warning"
                    }
                >
                    {displayStatus ===
                    "COMPLETE"
                        ? "Complete"
                        : displayStatus ===
                            "DRAFT"
                        ? "Draft"
                        : "Incomplete"}
                </StatusBadge>
            </header>

            <div className="mt-5 grid grid-cols-1 gap-4">
                {fields.map(
                    (field) => {
                        const errorKey =
                            `${student.studentId}.${field.key}`;

                        return (
                            <Input
                                key={
                                    field.key
                                }
                                label={
                                    field.label
                                }
                                type="number"
                                min={
                                    0
                                }
                                max={
                                    100
                                }
                                step="0.01"
                                value={
                                    student
                                        .components[
                                        field
                                            .key
                                    ] ??
                                    ""
                                }
                                disabled={
                                    disabled
                                }
                                error={
                                    errors[
                                        errorKey
                                    ]
                                }
                                onChange={(
                                    event,
                                ) => {
                                    updateComponent(
                                        field.key,
                                        event
                                            .target
                                            .value,
                                    );
                                }}
                            />
                        );
                    },
                )}
            </div>

            <footer className="mt-5 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                <div>
                    <p className="text-xs text-neutral-500">
                        Final Grade
                    </p>

                    <p className="mt-1 font-semibold text-[#35822E]">
                        {student.rawFinalGrade !==
                        undefined
                            ? `${student.rawFinalGrade.toFixed(
                                2,
                            )} (${student.finalGradeValue?.toFixed(
                                1,
                            )})`
                            : "—"}
                    </p>
                </div>

                {displayStatus ===
                "COMPLETE" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : null}
            </footer>
        </article>
    );
}