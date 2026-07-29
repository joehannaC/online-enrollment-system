import {
    BookCheck,
    BookOpen,
    ClipboardList,
    GraduationCap,
    Layers3,
} from "lucide-react";

import { SummaryCard } from "@/components/common";
import type { AcademicRecordSummary } from "@/types";

interface AcademicSummaryProps {
    summary: AcademicRecordSummary;
    isLoading?: boolean;
}

export default function AcademicSummary({
    summary,
    isLoading = false,
}: AcademicSummaryProps) {
    const items = [
        {
            label: "Required Units",
            value: summary.requiredUnits,
            description: "Program requirement",
            icon: Layers3,
        },
        {
            label: "Earned Units",
            value: summary.earnedUnits,
            description: "Completed units",
            icon: GraduationCap,
        },
        {
            label: "Remaining Units",
            value: summary.remainingUnits,
            description: "Units left to complete",
            icon: BookOpen,
        },
        {
            label: "Enrolled Units",
            value: summary.enrolledUnits,
            description: "Current enrollment",
            icon: BookCheck,
        },
        {
            label: "Enlisted Units",
            value: summary.enlistedUnits,
            description: "Pending confirmation",
            icon: ClipboardList,
        },
    ];

    return (
        <section
            aria-label="Academic summary"
            className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-5
            "
        >
            {items.map((item) => (
                <SummaryCard
                    key={item.label}
                    label={item.label}
                    value={isLoading ? "—" : item.value}
                    description={item.description}
                    icon={item.icon}
                />
            ))}
        </section>
    );
}