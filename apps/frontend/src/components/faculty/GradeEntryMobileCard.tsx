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
    student: GradeEntryStudent;
    disabled?: boolean;
    onChange: (
        studentId: string,
        components: GradeComponents,
    ) => void;
}

function toNumberOrUndefined(
    value: string,
): number | undefined {
    if (value.trim() === "") {
        return undefined;
    }

    const parsedValue = Number(value);

    return Number.isNaN(parsedValue)
        ? undefined
        : parsedValue;
}

export default function GradeEntryMobileCard({
    student,
    disabled = false,
    onChange,
}: GradeEntryMobileCardProps) {
    const isComplete =
        student.components.activitiesScore !==
            undefined &&
        student.components.midtermScore !==
            undefined &&
        student.components.finalScore !==
            undefined;

    function updateComponent(
        key: keyof GradeComponents,
        value: string,
    ): void {
        onChange(student.studentId, {
            ...student.components,
            [key]: toNumberOrUndefined(value),
        });
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
                            {student.fullName}
                        </h3>

                        <p className="mt-1 text-xs text-neutral-500">
                            {student.studentNumber}
                        </p>
                    </div>
                </div>

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
            </header>

            <div className="mt-5 grid grid-cols-1 gap-4">
                <Input
                    label="Activities 30%"
                    type="number"
                    min={0}
                    max={30}
                    step="0.01"
                    value={
                        student.components
                            .activitiesScore ?? ""
                    }
                    disabled={disabled}
                    onChange={(event) =>
                        updateComponent(
                            "activitiesScore",
                            event.target.value,
                        )
                    }
                />

                <Input
                    label="Midterm 30%"
                    type="number"
                    min={0}
                    max={30}
                    step="0.01"
                    value={
                        student.components
                            .midtermScore ?? ""
                    }
                    disabled={disabled}
                    onChange={(event) =>
                        updateComponent(
                            "midtermScore",
                            event.target.value,
                        )
                    }
                />

                <Input
                    label="Final 40%"
                    type="number"
                    min={0}
                    max={40}
                    step="0.01"
                    value={
                        student.components
                            .finalScore ?? ""
                    }
                    disabled={disabled}
                    onChange={(event) =>
                        updateComponent(
                            "finalScore",
                            event.target.value,
                        )
                    }
                />
            </div>

            <footer className="mt-5 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                <div>
                    <p className="text-xs text-neutral-500">
                        Computed Score
                    </p>

                    <p className="mt-1 font-semibold text-[#35822E]">
                        {student.computedScore ??
                            "—"}{" "}
                        / 100
                    </p>
                </div>

                {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : null}
            </footer>
        </article>
    );
}