import {
    BookOpenCheck,
    CheckCircle2,
    Clock3,
    Users,
} from "lucide-react";

import { SummaryCard } from "@/components/common";
import type { FacultyDashboardResponse } from "@/types";

interface FacultySummaryProps {
    summary: FacultyDashboardResponse["summary"];
    isLoading?: boolean;
}

export default function FacultySummary({
    summary,
    isLoading = false,
}: FacultySummaryProps) {
    return (
        <section
            aria-label="Faculty summary"
            className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
                xl:grid-cols-4
            "
        >
            <SummaryCard
                label="Handling Subjects"
                value={
                    isLoading
                        ? "—"
                        : summary.handledSubjectCount
                }
                description="This term"
                icon={BookOpenCheck}
            />

            <SummaryCard
                label="Enrolled Students"
                value={
                    isLoading
                        ? "—"
                        : summary.enrolledStudentCount
                }
                description="Across all classes"
                icon={Users}
            />

            <SummaryCard
                label="Pending Grades"
                value={
                    isLoading
                        ? "—"
                        : summary.pendingGradeCount
                }
                description="Require input"
                icon={Clock3}
                accent={
                    summary.pendingGradeCount > 0
                        ? "danger"
                        : "primary"
                }
            />

            <SummaryCard
                label="Submitted"
                value={
                    isLoading
                        ? "—"
                        : `${summary.submissionPercentage}%`
                }
                description="Overall completion"
                icon={CheckCircle2}
            />
        </section>
    );
}