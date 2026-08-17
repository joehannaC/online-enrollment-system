"use client";

import type {
    ChangeEvent,
} from "react";

import {
    StatusBadge,
} from "@/components/common";
import type {
    GradeComponents,
    GradeEntryStudent,
} from "@/types";

interface GradeEntryTableProps {
    students:
        GradeEntryStudent[];
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

function parseScore(
    event:
        ChangeEvent<HTMLInputElement>,
): number | undefined {
    const value =
        event.target.value.trim();

    if (value === "") {
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

type DisplayGradeStatus =
    | "INCOMPLETE"
    | "DRAFT"
    | "COMPLETE";

function getDisplayGradeStatus(
    student: GradeEntryStudent,
): DisplayGradeStatus {
    if (
        student.status ===
        "SUBMITTED"
    ) {
        return "COMPLETE";
    }

    const values = [
        student.components
            .activitiesScore,

        student.components
            .majorOutput1Score,

        student.components
            .majorOutput2Score,

        student.components
            .midtermExamScore,

        student.components
            .finalExamScore,
    ];

    const hasAnyInput =
        values.some(
            (value) =>
                typeof value ===
                "number",
        );

    return hasAnyInput
        ? "DRAFT"
        : "INCOMPLETE";
}

function scoreInputClass(
    hasError: boolean,
): string {
    return [
        "h-10 w-20 rounded-lg border bg-white px-2 text-center text-sm text-neutral-900 outline-none transition disabled:cursor-not-allowed disabled:bg-neutral-100",
        hasError
            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-neutral-300 focus:border-[#35822E] focus:ring-4 focus:ring-[#35822E]/15",
    ].join(" ");
}

export default function GradeEntryTable({
    students,
    disabled = false,
    errors = {},
    onChange,
}: GradeEntryTableProps) {
    function updateComponent(
        student:
            GradeEntryStudent,
        key:
            keyof GradeComponents,
        value:
            number | undefined,
    ): void {
        onChange(
            student.studentId,
            {
                ...student.components,
                [key]: value,
            },
        );
    }

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

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] border-collapse">
                    <thead className="bg-[#35822E]/10">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Student
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Student Number
                            </th>

                            {fields.map(
                                (field) => (
                                    <th
                                        key={
                                            field.key
                                        }
                                        className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]"
                                    >
                                        {
                                            field.label
                                        }
                                    </th>
                                ),
                            )}

                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Final Grade
                            </th>

                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                        {students.map(
                            (student) => {
                                const displayStatus =
                                    getDisplayGradeStatus(
                                        student,
                                    );

                                return (
                                    <tr
                                        key={
                                            student.studentId
                                        }
                                        className="hover:bg-neutral-50"
                                    >
                                        <td className="px-5 py-4 font-medium text-neutral-900">
                                            {
                                                student.fullName
                                            }
                                        </td>

                                        <td className="px-5 py-4 text-sm text-neutral-600">
                                            {
                                                student.studentNumber
                                            }
                                        </td>

                                        {fields.map(
                                            (
                                                field,
                                            ) => {
                                                const errorKey =
                                                    `${student.studentId}.${field.key}`;

                                                return (
                                                    <td
                                                        key={
                                                            field.key
                                                        }
                                                        className="px-3 py-4 text-center"
                                                    >
                                                        <input
                                                            type="number"
                                                            min={
                                                                0
                                                            }
                                                            max={
                                                                100
                                                            }
                                                            step="0.01"
                                                            disabled={
                                                                disabled
                                                            }
                                                            value={
                                                                student
                                                                    .components[
                                                                    field
                                                                        .key
                                                                ] ??
                                                                ""
                                                            }
                                                            aria-invalid={
                                                                Boolean(
                                                                    errors[
                                                                        errorKey
                                                                    ],
                                                                )
                                                            }
                                                            title={
                                                                errors[
                                                                    errorKey
                                                                ]
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                updateComponent(
                                                                    student,
                                                                    field.key,
                                                                    parseScore(
                                                                        event,
                                                                    ),
                                                                );
                                                            }}
                                                            className={
                                                                scoreInputClass(
                                                                    Boolean(
                                                                        errors[
                                                                            errorKey
                                                                        ],
                                                                    ),
                                                                )
                                                            }
                                                        />
                                                    </td>
                                                );
                                            },
                                        )}

                                        <td className="px-5 py-4 text-center text-sm font-semibold text-[#35822E]">
                                            {student.rawFinalGrade !==
                                            undefined
                                                ? `${student.rawFinalGrade.toFixed(
                                                    2,
                                                )} (${student.finalGradeValue?.toFixed(
                                                    1,
                                                )})`
                                                : "—"}
                                        </td>

                                        <td className="px-5 py-4 text-center">
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
                                        </td>
                                    </tr>
                                );
                            },
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}