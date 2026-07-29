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
    students: GradeEntryStudent[];
    disabled?: boolean;
    onChange: (
        studentId: string,
        components: GradeComponents,
    ) => void;
}

function parseScore(
    event: ChangeEvent<HTMLInputElement>,
): number | undefined {
    if (event.target.value.trim() === "") {
        return undefined;
    }

    const parsedValue = Number(
        event.target.value,
    );

    return Number.isNaN(parsedValue)
        ? undefined
        : parsedValue;
}

export default function GradeEntryTable({
    students,
    disabled = false,
    onChange,
}: GradeEntryTableProps) {
    function updateComponent(
        student: GradeEntryStudent,
        key: keyof GradeComponents,
        value: number | undefined,
    ): void {
        onChange(student.studentId, {
            ...student.components,
            [key]: value,
        });
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                    <thead className="bg-[#35822E]/10">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Student
                            </th>

                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Student Number
                            </th>

                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Activities 30%
                            </th>

                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Midterm 30%
                            </th>

                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Final 40%
                            </th>

                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Computed
                            </th>

                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#01301E]">
                                Status
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                        {students.map((student) => {
                            const isComplete =
                                student.components
                                    .activitiesScore !==
                                    undefined &&
                                student.components
                                    .midtermScore !==
                                    undefined &&
                                student.components
                                    .finalScore !==
                                    undefined;

                            return (
                                <tr
                                    key={
                                        student.studentId
                                    }
                                    className="hover:bg-neutral-50"
                                >
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-neutral-900">
                                            {
                                                student.fullName
                                            }
                                        </p>
                                    </td>

                                    <td className="px-5 py-4 text-sm text-neutral-600">
                                        {
                                            student.studentNumber
                                        }
                                    </td>

                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            step="0.01"
                                            disabled={
                                                disabled
                                            }
                                            value={
                                                student
                                                    .components
                                                    .activitiesScore ??
                                                ""
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateComponent(
                                                    student,
                                                    "activitiesScore",
                                                    parseScore(
                                                        event,
                                                    ),
                                                )
                                            }
                                            className="
                                                h-10 w-24 rounded-lg
                                                border border-neutral-300
                                                bg-white px-3 text-center
                                                text-sm text-neutral-900
                                                outline-none transition
                                                focus:border-[#35822E]
                                                focus:ring-4
                                                focus:ring-[#35822E]/15
                                                disabled:cursor-not-allowed
                                                disabled:bg-neutral-100
                                            "
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            step="0.01"
                                            disabled={
                                                disabled
                                            }
                                            value={
                                                student
                                                    .components
                                                    .midtermScore ??
                                                ""
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateComponent(
                                                    student,
                                                    "midtermScore",
                                                    parseScore(
                                                        event,
                                                    ),
                                                )
                                            }
                                            className="
                                                h-10 w-24 rounded-lg
                                                border border-neutral-300
                                                bg-white px-3 text-center
                                                text-sm text-neutral-900
                                                outline-none transition
                                                focus:border-[#35822E]
                                                focus:ring-4
                                                focus:ring-[#35822E]/15
                                                disabled:cursor-not-allowed
                                                disabled:bg-neutral-100
                                            "
                                        />
                                    </td>

                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            min={0}
                                            max={40}
                                            step="0.01"
                                            disabled={
                                                disabled
                                            }
                                            value={
                                                student
                                                    .components
                                                    .finalScore ??
                                                ""
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateComponent(
                                                    student,
                                                    "finalScore",
                                                    parseScore(
                                                        event,
                                                    ),
                                                )
                                            }
                                            className="
                                                h-10 w-24 rounded-lg
                                                border border-neutral-300
                                                bg-white px-3 text-center
                                                text-sm text-neutral-900
                                                outline-none transition
                                                focus:border-[#35822E]
                                                focus:ring-4
                                                focus:ring-[#35822E]/15
                                                disabled:cursor-not-allowed
                                                disabled:bg-neutral-100
                                            "
                                        />
                                    </td>

                                    <td className="px-5 py-4 text-center text-sm font-semibold text-neutral-900">
                                        {student.computedScore ??
                                            "—"}{" "}
                                        / 100
                                    </td>

                                    <td className="px-5 py-4 text-center">
                                        <StatusBadge
                                            variant={
                                                isComplete
                                                    ? "success"
                                                    : "warning"
                                            }
                                        >
                                            {isComplete
                                                ? "Complete"
                                                : "Incomplete"}
                                        </StatusBadge>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}