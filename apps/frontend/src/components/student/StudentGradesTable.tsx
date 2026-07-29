import {
    DataTable,
    StatusBadge,
    type DataTableColumn,
} from "@/components/common";
import type { StudentGradeRecord } from "@/types";

interface StudentGradesTableProps {
    grades: StudentGradeRecord[];
    isLoading?: boolean;
}

function renderGrade(
    grade: StudentGradeRecord,
): string {
    if (grade.gradeCode) {
        return grade.gradeCode;
    }

    if (
        typeof grade.numericGrade === "number"
    ) {
        return grade.numericGrade.toFixed(1);
    }

    return "—";
}

function getResultVariant(
    result: StudentGradeRecord["result"],
) {
    switch (result) {
        case "PASSED":
            return "success";
        case "FAILED":
            return "danger";
        case "CREDITED":
            return "info";
        case "INCOMPLETE":
            return "warning";
        default:
            return "neutral";
    }
}

export default function StudentGradesTable({
    grades,
    isLoading = false,
}: StudentGradesTableProps) {
    const columns: DataTableColumn<StudentGradeRecord>[] =
        [
            {
                key: "courseName",
                header: "Course Name",
                render: (grade) => (
                    <div>
                        <p className="font-medium text-neutral-900">
                            {grade.courseName}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                            Section{" "}
                            {grade.sectionCode}
                        </p>
                    </div>
                ),
            },
            {
                key: "courseCode",
                header: "Course Code",
                render: (grade) =>
                    grade.courseCode,
            },
            {
                key: "units",
                header: "Units",
                render: (grade) =>
                    grade.units,
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "grade",
                header: "Grade",
                render: (grade) => (
                    <span className="font-semibold text-neutral-900">
                        {renderGrade(grade)}
                    </span>
                ),
                className: "text-center",
                headerClassName: "text-center",
            },
            {
                key: "result",
                header: "Status",
                render: (grade) => (
                    <StatusBadge
                        variant={getResultVariant(
                            grade.result,
                        )}
                    >
                        {grade.result}
                    </StatusBadge>
                ),
                className: "text-center",
                headerClassName: "text-center",
            },
        ];

    return (
        <DataTable
            caption="Student grades"
            columns={columns}
            data={grades}
            isLoading={isLoading}
            getRowKey={(grade) => grade.id}
            emptyTitle="No grades available"
            emptyDescription="Verified and submitted grades will appear here."
        />
    );
}