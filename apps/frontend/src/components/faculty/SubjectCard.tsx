import {
    CalendarDays,
    DoorOpen,
    Users,
} from "lucide-react";
import Link from "next/link";

import {
    Button,
    StatusBadge,
} from "@/components/common";
import type { FacultySubject } from "@/types";

interface SubjectCardProps {
    subject: FacultySubject;
}

function formatSchedule(
    subject: FacultySubject,
): string {
    if (subject.schedule.length === 0) {
        return "No schedule assigned";
    }

    return subject.schedule
        .map(
            (item) =>
                `${item.days.join("/")} • ${item.startTime}–${item.endTime}`,
        )
        .join(", ");
}

function getRooms(
    subject: FacultySubject,
): string {
    if (subject.schedule.length === 0) {
        return "TBA";
    }

    return subject.schedule
        .map((item) => item.room)
        .join(", ");
}

export default function SubjectCard({
    subject,
}: SubjectCardProps) {
    const isComplete =
        subject.gradedStudents >=
        subject.enrolledStudents;

    return (
        <article
            className="
                rounded-2xl border border-neutral-200
                border-l-4 border-l-[#35822E]
                bg-white p-5 shadow-sm
                transition hover:shadow-md
            "
        >
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-[#35822E]">
                        {subject.courseName}
                    </h3>

                    <p className="mt-1 text-xs text-neutral-500">
                        {subject.courseCode} • Section{" "}
                        {subject.sectionCode}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-sm text-neutral-600">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                        <div>
                            <p className="text-xs font-medium text-neutral-500">
                                Schedule
                            </p>

                            <p className="mt-1">
                                {formatSchedule(subject)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-neutral-600">
                        <DoorOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                        <div>
                            <p className="text-xs font-medium text-neutral-500">
                                Room
                            </p>

                            <p className="mt-1">
                                {getRooms(subject)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Users className="h-4 w-4 text-[#35822E]" />

                        <span>
                            {subject.enrolledStudents} students
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge
                            variant={
                                isComplete
                                    ? "success"
                                    : "warning"
                            }
                        >
                            {subject.gradedStudents} /{" "}
                            {subject.enrolledStudents} graded
                        </StatusBadge>

                        <Link
                            href={`/faculty/grade-entry/${subject.sectionId}`}
                        >
                            <Button size="sm">
                                View Class
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}