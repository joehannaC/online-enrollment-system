"use client";

import {
    BookOpen,
    Search,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import {
    EmptyState,
    Input,
    Select,
} from "@/components/common";
import type { FacultySubject } from "@/types";

import SubjectCard from "./SubjectCard";

interface HandledSubjectsProps {
    subjects: FacultySubject[];
    isLoading?: boolean;
}

export default function HandledSubjects({
    subjects,
    isLoading = false,
}: HandledSubjectsProps) {
    const [searchQuery, setSearchQuery] =
        useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const filteredSubjects = useMemo(() => {
        const normalizedQuery =
            searchQuery.trim().toLowerCase();

        return subjects.filter((subject) => {
            const matchesSearch =
                normalizedQuery.length === 0 ||
                subject.courseName
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                subject.courseCode
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                subject.sectionCode
                    .toLowerCase()
                    .includes(normalizedQuery);

            const isComplete =
                subject.gradedStudents >=
                subject.enrolledStudents;

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "COMPLETE" &&
                    isComplete) ||
                (statusFilter === "PENDING" &&
                    !isComplete);

            return matchesSearch && matchesStatus;
        });
    }, [
        searchQuery,
        statusFilter,
        subjects,
    ]);

    return (
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
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(
                                    event.target.value,
                                )
                            }
                            placeholder="Search subject or code"
                            leftIcon={Search}
                        />

                        <Select
                            name="gradingStatus"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value,
                                )
                            }
                            options={[
                                {
                                    label: "All subjects",
                                    value: "ALL",
                                },
                                {
                                    label: "Complete",
                                    value: "COMPLETE",
                                },
                                {
                                    label: "Pending",
                                    value: "PENDING",
                                },
                            ]}
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                    {Array.from({ length: 4 }).map(
                        (_, index) => (
                            <div
                                key={index}
                                className="h-56 animate-pulse rounded-2xl bg-neutral-100"
                            />
                        ),
                    )}
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={BookOpen}
                        title="No handled subjects"
                        description="No subjects match the selected search or filter."
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                    {filteredSubjects.map(
                        (subject) => (
                            <SubjectCard
                                key={subject.sectionId}
                                subject={subject}
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    );
}