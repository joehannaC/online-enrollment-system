"use client";

import {
    BookOpen,
    Search,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import {
    EmptyState,
    Input,
    Select,
    StatusBadge,
} from "@/components/common";
import type {
    FacultySubject,
} from "@/types";

import SubjectCard from "./SubjectCard";

interface HandledSubjectsProps {
    subjects: FacultySubject[];
    isLoading?: boolean;
}

function formatGrade(
    value:
        | number
        | null,
): string {
    return value === null
        ? "—"
        : value.toFixed(1);
}

export default function HandledSubjects({
    subjects,
    isLoading = false,
}: HandledSubjectsProps) {
    const [
        searchQuery,
        setSearchQuery,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("ALL");

    const [
        selectedSubject,
        setSelectedSubject,
    ] =
        useState<FacultySubject | null>(
            null,
        );

    const filteredSubjects =
        useMemo(() => {
            const normalizedQuery =
                searchQuery
                    .trim()
                    .toLowerCase();

            return subjects.filter(
                (subject) => {
                    const matchesSearch =
                        normalizedQuery.length ===
                            0 ||
                        subject.courseName
                            .toLowerCase()
                            .includes(
                                normalizedQuery,
                            ) ||
                        subject.courseCode
                            .toLowerCase()
                            .includes(
                                normalizedQuery,
                            ) ||
                        subject.sectionCode
                            .toLowerCase()
                            .includes(
                                normalizedQuery,
                            );

                    const isSubmitted =
                        subject.submissionStatus ===
                            "SUBMITTED" ||
                        subject.submissionStatus ===
                            "VERIFIED";

                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        (statusFilter ===
                            "SUBMITTED" &&
                            isSubmitted) ||
                        (statusFilter ===
                            "PENDING" &&
                            !isSubmitted);

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                },
            );
        }, [
            searchQuery,
            statusFilter,
            subjects,
        ]);

    const shouldScroll =
        filteredSubjects.length >
        4;

    return (
        <>
            <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <header className="border-b border-neutral-200 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-[#35822E]" />

                            <h2 className="text-lg font-semibold text-[#35822E]">
                                My Handled Subjects
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_170px]">
                            <Input
                                name="subjectSearch"
                                value={
                                    searchQuery
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setSearchQuery(
                                        event
                                            .target
                                            .value,
                                    );
                                }}
                                placeholder="Search subject or code"
                                leftIcon={
                                    Search
                                }
                            />

                            <Select
                                name="gradingStatus"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setStatusFilter(
                                        event
                                            .target
                                            .value,
                                    );
                                }}
                                options={[
                                    {
                                        label:
                                            "All subjects",
                                        value:
                                            "ALL",
                                    },
                                    {
                                        label:
                                            "Submitted",
                                        value:
                                            "SUBMITTED",
                                    },
                                    {
                                        label:
                                            "Pending",
                                        value:
                                            "PENDING",
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                        {Array.from({
                            length: 4,
                        }).map(
                            (
                                _,
                                index,
                            ) => (
                                <div
                                    key={
                                        index
                                    }
                                    className="h-72 animate-pulse rounded-2xl bg-neutral-100"
                                />
                            ),
                        )}
                    </div>
                ) : filteredSubjects.length ===
                0 ? (
                    <div className="p-5">
                        <EmptyState
                            compact
                            icon={
                                BookOpen
                            }
                            title="No handled subjects"
                            description="No subjects match the selected search or filter."
                        />
                    </div>
                ) : (
                    <div
                        className={[
                            "grid grid-cols-1 gap-4 p-5 xl:grid-cols-2",
                            shouldScroll
                                ? "max-h-[650px] overflow-y-auto overscroll-contain pr-3"
                                : "",
                        ].join(
                            " ",
                        )}
                    >
                        {filteredSubjects.map(
                            (
                                subject,
                            ) => (
                                <SubjectCard
                                    key={
                                        subject.sectionId
                                    }
                                    subject={
                                        subject
                                    }
                                    onView={
                                        setSelectedSubject
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>

            {selectedSubject ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dashboard-grade-summary-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
                    onClick={() => {
                        setSelectedSubject(
                            null,
                        );
                    }}
                >
                    <section
                        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(
                            event,
                        ) => {
                            event.stopPropagation();
                        }}
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
                            <div>
                                <h2
                                    id="dashboard-grade-summary-title"
                                    className="text-xl font-semibold text-[#35822E]"
                                >
                                    Grade Summary
                                </h2>

                                <p className="mt-1 text-sm text-neutral-600">
                                    {
                                        selectedSubject.courseCode
                                    }{" "}
                                    • Section{" "}
                                    {
                                        selectedSubject.sectionCode
                                    }{" "}
                                    —{" "}
                                    {
                                        selectedSubject.courseName
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close grade summary"
                                onClick={() => {
                                    setSelectedSubject(
                                        null,
                                    );
                                }}
                                className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="max-h-[65vh] overflow-auto">
                            <table className="w-full min-w-[620px] border-collapse text-sm">
                                <thead className="sticky top-0 bg-neutral-100 text-neutral-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Student
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Student Number
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Final Grade
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedSubject.students.map(
                                        (
                                            student,
                                        ) => (
                                            <tr
                                                key={
                                                    student.studentId
                                                }
                                                className="border-b border-neutral-200 last:border-b-0"
                                            >
                                                <td className="px-4 py-3 font-medium text-neutral-900">
                                                    {
                                                        student.fullName
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center text-neutral-600">
                                                    {
                                                        student.studentNumber
                                                    }
                                                </td>

                                                <td className="px-4 py-3 text-center">
                                                    <StatusBadge
                                                        variant={
                                                            student.gradeStatus ===
                                                            "SUBMITTED"
                                                                ? "success"
                                                                : student.gradeStatus ===
                                                                    "DRAFT"
                                                                ? "primary"
                                                                : "warning"
                                                        }
                                                    >
                                                        {
                                                            student.gradeStatus
                                                        }
                                                    </StatusBadge>
                                                </td>

                                                <td className="px-4 py-3 text-center font-semibold text-[#35822E]">
                                                    {student.gradeStatus ===
                                                    "SUBMITTED"
                                                        ? formatGrade(
                                                            student.finalGradeValue,
                                                        )
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            ) : null}
        </>
    );
}
