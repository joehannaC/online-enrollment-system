import {
    DataTable,
    StatusBadge,
} from "@/components/common";
import type {
    CourseHistoryRecord,
    DataTableColumn,
} from "@/types";

interface CourseHistoryTableProps {
    records: CourseHistoryRecord[];
    isLoading?: boolean;
}

function getStatusBadge(
    record: CourseHistoryRecord,
) {
    if (record.result === "PASSED") {
        return (
            <StatusBadge variant="success">
                Passed
            </StatusBadge>
        );
    }

    if (record.result === "FAILED") {
        return (
            <StatusBadge variant="danger">
                Failed
            </StatusBadge>
        );
    }

    if (record.result === "CREDITED") {
        return (
            <StatusBadge variant="info">
                Credited
            </StatusBadge>
        );
    }

    if (record.enrollmentStatus === "ENROLLED") {
        return (
            <StatusBadge variant="neutral">
                Registered
            </StatusBadge>
        );
    }

    return (
        <StatusBadge variant="warning">
            {record.enrollmentStatus}
        </StatusBadge>
    );
}

export default function CourseHistoryTable({
    records,
    isLoading = false,
}: CourseHistoryTableProps) {
    const columns: DataTableColumn<CourseHistoryRecord>[] =
        [
            {
                key: "courseName",
                header: "Course Name",
                render: (record) => (
                    <div>
                        <p className="font-medium text-neutral-900">
                            {record.courseName}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400 sm:hidden">
                            {record.courseCode}
                        </p>
                    </div>
                ),
            },
            {
                key: "courseCode",
                header: "Course Code",
                render: (record) =>
                    record.courseCode,
            },
            {
                key: "units",
                header: "Units",
                render: (record) =>
                    record.units,
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "term",
                header: "Term",
                render: (record) => (
                    <div>
                        <p>{record.termName}</p>

                        <p className="mt-1 text-xs text-neutral-400">
                            {record.academicYear}
                        </p>
                    </div>
                ),
            },
            {
                key: "status",
                header: "Status",
                render: (record) =>
                    getStatusBadge(record),
                className: "text-center",
                headerClassName: "text-center",
            },
        ];

    return (
        <section>
            <DataTable
                caption="Student course history"
                columns={columns}
                data={records}
                isLoading={isLoading}
                getRowKey={(record) =>
                    record.enrollmentId
                }
                emptyTitle="No course history"
                emptyDescription="Completed and currently enrolled courses will appear here."
            />
        </section>
    );
}