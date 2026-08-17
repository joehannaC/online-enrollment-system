"use client";

import {
    BookOpen,
    Clock3,
    Search,
    UserRound,
} from "lucide-react";
import {
    useMemo,
    useState,
} from "react";

import {
    Button,
    EmptyState,
    Input,
    Select,
    StatusBadge,
} from "@/components/common";
import type { AvailableSection } from "@/types";

interface AvailableSectionsProps {
    sections: AvailableSection[];
    selectedSectionIds?: string[];
    isLoading?: boolean;
    onSelectSection?: (
        section: AvailableSection,
    ) => void;
    onRemoveSection?: (
        section: AvailableSection,
    ) => void;
}

function formatSchedule(
    section: AvailableSection,
): string {
    if (section.schedule.length === 0) {
        return "No schedule assigned";
    }

    return section.schedule
        .map(
            (item) =>
                `${item.days.join("/")} ${item.startTime}–${item.endTime}`,
        )
        .join(", ");
}

export default function AvailableSections({
    sections,
    selectedSectionIds = [],
    isLoading = false,
    onSelectSection,
    onRemoveSection,
}: AvailableSectionsProps) {
    const [searchQuery, setSearchQuery] =
        useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const filteredSections = useMemo(() => {
        const normalizedQuery =
            searchQuery.trim().toLowerCase();

        return sections.filter((section) => {
            const matchesSearch =
                normalizedQuery.length === 0 ||
                section.course.courseCode
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                section.course.courseName
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                section.sectionCode
                    .toLowerCase()
                    .includes(normalizedQuery);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "OPEN" &&
                    !section.isFull &&
                    section.status === "OPEN") ||
                (statusFilter === "FULL" &&
                    section.isFull);

            return matchesSearch && matchesStatus;
        });
    }, [
        searchQuery,
        sections,
        statusFilter,
    ]);

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[#35822E]" />

                        <h2 className="text-lg font-semibold text-[#35822E]">
                            Available Courses
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(220px,1fr)_160px]">
                        <Input
                            name="sectionSearch"
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(
                                    event.target.value,
                                )
                            }
                            placeholder="Search course or code"
                            leftIcon={Search}
                        />

                        <Select
                            name="sectionStatus"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value,
                                )
                            }
                            options={[
                                {
                                    label: "All sections",
                                    value: "ALL",
                                },
                                {
                                    label: "Open sections",
                                    value: "OPEN",
                                },
                                {
                                    label: "Full sections",
                                    value: "FULL",
                                },
                            ]}
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="p-5 text-sm text-neutral-500">
                    Loading available sections...
                </div>
            ) : filteredSections.length === 0 ? (
                <div className="p-5">
                    <EmptyState
                        compact
                        icon={BookOpen}
                        title="No available sections"
                        description="No sections match the current search and filter."
                    />
                </div>
            ) : (
                <div className="divide-y divide-neutral-100">
                    {filteredSections.map(
                        (section) => {
                            const isSelected =
                                selectedSectionIds.includes(
                                    section.id,
                                );

                            return (
                                <article
                                    key={section.id}
                                    className="
                                        grid grid-cols-1
                                        gap-4 px-5 py-5
                                        lg:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto_auto]
                                        lg:items-center
                                    "
                                >
                                    <div>
                                        <h3 className="font-semibold text-neutral-900">
                                            {
                                                section
                                                    .course
                                                    .courseName
                                            }
                                        </h3>

                                        <p className="mt-1 text-xs text-neutral-500">
                                            {
                                                section
                                                    .course
                                                    .courseCode
                                            }{" "}
                                            • Section{" "}
                                            {
                                                section.sectionCode
                                            }{" "}
                                            •{" "}
                                            {
                                                section
                                                    .course
                                                    .units
                                            }{" "}
                                            units
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-2 text-sm text-neutral-600">
                                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#35822E]" />

                                        <div>
                                            <p>
                                                {formatSchedule(
                                                    section,
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs text-neutral-400">
                                                {section.schedule
                                                    .map(
                                                        (
                                                            item,
                                                        ) =>
                                                            item.room,
                                                    )
                                                    .join(
                                                        ", ",
                                                    )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                                        <UserRound className="h-4 w-4 text-[#35822E]" />

                                        <span>
                                            {
                                                section.faculty
                                                    .displayName
                                            }
                                        </span>
                                    </div>

                                    <StatusBadge
                                        variant={
                                            section.isFull
                                                ? "danger"
                                                : section.availableSlots <=
                                                    5
                                                ? "warning"
                                                : "success"
                                        }
                                    >
                                        {
                                            section.availableSlots
                                        }{" "}
                                        /{" "}
                                        {section.capacity}{" "}
                                        slots
                                    </StatusBadge>

                                    <Button
                                        size="sm"
                                        variant={
                                            isSelected
                                                ? "outline"
                                                : "primary"
                                        }
                                        disabled={
                                            section.isFull ||
                                            section.status !==
                                                "OPEN" ||
                                            section.isAlreadyEnrolled
                                        }
                                        onClick={() => {
                                            if (isSelected) {
                                                onRemoveSection?.(
                                                    section,
                                                );
                                            } else {
                                                onSelectSection?.(
                                                    section,
                                                );
                                            }
                                        }}
                                    >
                                        {section.isAlreadyEnrolled
                                            ? "Enrolled"
                                            : section.isFull
                                            ? "Full"
                                            : isSelected
                                                ? "Remove"
                                                : "Enroll"}
                                    </Button>
                                </article>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}