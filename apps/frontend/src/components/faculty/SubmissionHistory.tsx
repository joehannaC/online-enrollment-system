import {
    DataTable,
    StatusBadge,
    type DataTableColumn,
    type StatusBadgeVariant,
} from "@/components/common";
import type {
    GradeSubmissionRecord,
} from "@/types";

interface SubmissionHistoryProps {
    submissions: GradeSubmissionRecord[];
    isLoading?: boolean;
    onView?: (
        submission: GradeSubmissionRecord,
    ) => void;
    onContinue?: (
        submission: GradeSubmissionRecord,
    ) => void;
}

function getStatusVariant(
    status: GradeSubmissionRecord["status"],
): StatusBadgeVariant {
    switch (status) {
        case "SUBMITTED":
            return "success";

        case "VERIFIED":
            return "info";

        case "RETURNED":
            return "danger";

        case "DRAFT":
            return "warning";

        default:
            return "neutral";
    }
}

function formatDate(
    value?: string,
): string {
    if (!value) {
        return "Draft saved";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

export default function SubmissionHistory({
    submissions,
    isLoading = false,
    onView,
    onContinue,
}: SubmissionHistoryProps) {
    const columns: DataTableColumn<GradeSubmissionRecord>[] =
        [
            {
                key: "subject",
                header: "Subject",
                render: (submission) => (
                    <div>
                        <p className="font-medium text-neutral-900">
                            {
                                submission.courseName
                            }
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                            {
                                submission.courseCode
                            }
                        </p>
                    </div>
                ),
            },
            {
                key: "section",
                header: "Section",
                render: (submission) =>
                    submission.sectionCode,
            },
            {
                key: "gradeType",
                header: "Grade Type",
                render: (submission) =>
                    submission.gradeType,
            },
            {
                key: "submitted",
                header: "Submitted",
                render: (submission) =>
                    formatDate(
                        submission.submittedAt,
                    ),
            },
            {
                key: "students",
                header: "Students",
                render: (submission) =>
                    `${submission.completedCount} / ${submission.totalStudents}`,
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "status",
                header: "Status",
                render: (submission) => (
                    <StatusBadge
                        variant={getStatusVariant(
                            submission.status,
                        )}
                    >
                        {submission.status}
                    </StatusBadge>
                ),
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "action",
                header: "Action",
                render: (submission) => (
                    <button
                        type="button"
                        onClick={() => {
                            if (
                                submission.status ===
                                "DRAFT"
                            ) {
                                onContinue?.(
                                    submission,
                                );
                                return;
                            }

                            onView?.(submission);
                        }}
                        className="
                            rounded-full border
                            border-[#35822E]
                            px-4 py-1.5 text-xs
                            font-semibold text-[#35822E]
                            transition
                            hover:bg-[#35822E]
                            hover:text-white
                        "
                    >
                        {submission.status ===
                        "DRAFT"
                            ? "Continue"
                            : "View"}
                    </button>
                ),
                className: "text-center",
                headerClassName: "text-center",
            },
        ];

    return (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <header className="border-b border-neutral-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-[#35822E]">
                    Submission History
                </h2>
            </header>

            <DataTable
                caption="Faculty grade submission history"
                columns={columns}
                data={submissions}
                isLoading={isLoading}
                getRowKey={(submission) =>
                    submission.id
                }
                emptyTitle="No submission records"
                emptyDescription="Draft and submitted grade records will appear here."
                className="rounded-none border-0 shadow-none"
            />
        </section>
    );
}