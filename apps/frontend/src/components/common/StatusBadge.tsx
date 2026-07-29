import type { ReactNode } from "react";

import type {
    AccountStatus,
    AcademicTermStatus,
    EnrollmentStatus,
    GradeResult,
    GradeStatus,
    SectionStatus,
} from "@/types";

export type StatusBadgeVariant =
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "primary";

export type ApplicationStatus =
    | AccountStatus
    | AcademicTermStatus
    | EnrollmentStatus
    | SectionStatus
    | GradeStatus
    | GradeResult;

interface BaseStatusBadgeProps {
    dot?: boolean;
    className?: string;
}

interface ManualStatusBadgeProps
    extends BaseStatusBadgeProps {
    children: ReactNode;
    variant?: StatusBadgeVariant;
    status?: never;
}

interface AutomaticStatusBadgeProps
    extends BaseStatusBadgeProps {
    status: ApplicationStatus;
    children?: ReactNode;
    variant?: never;
}

export type StatusBadgeProps =
    | ManualStatusBadgeProps
    | AutomaticStatusBadgeProps;

const variantClasses: Record<
    StatusBadgeVariant,
    string
> = {
    success:
        "border-green-600/40 bg-green-50 text-green-700",

    warning:
        "border-amber-500/50 bg-amber-50 text-amber-700",

    danger:
        "border-red-500/40 bg-red-50 text-red-700",

    info:
        "border-blue-500/40 bg-blue-50 text-blue-700",

    neutral:
        "border-neutral-300 bg-neutral-50 text-neutral-700",

    primary:
        "border-[#35822E]/40 bg-[#35822E]/10 text-[#2d7028]",
};

const dotClasses: Record<
    StatusBadgeVariant,
    string
> = {
    success: "bg-green-600",
    warning: "bg-amber-500",
    danger: "bg-red-600",
    info: "bg-blue-600",
    neutral: "bg-neutral-500",
    primary: "bg-[#35822E]",
};

const statusVariantMap: Record<
    ApplicationStatus,
    StatusBadgeVariant
> = {
    ACTIVE: "success",
    INACTIVE: "neutral",
    SUSPENDED: "danger",

    UPCOMING: "info",
    COMPLETED: "success",

    ENLISTED: "warning",
    ENROLLED: "success",
    DROPPED: "danger",

    OPEN: "success",
    CLOSED: "neutral",
    CANCELLED: "danger",

    DRAFT: "warning",
    SUBMITTED: "info",
    VERIFIED: "success",
    RETURNED: "danger",

    PASSED: "success",
    FAILED: "danger",
    CREDITED: "info",
    INCOMPLETE: "warning",
    PENDING: "neutral",
};

const statusLabelMap: Record<
    ApplicationStatus,
    string
> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",

    UPCOMING: "Upcoming",
    COMPLETED: "Completed",

    ENLISTED: "Enlisted",
    ENROLLED: "Enrolled",
    DROPPED: "Dropped",

    OPEN: "Open",
    CLOSED: "Closed",
    CANCELLED: "Cancelled",

    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    VERIFIED: "Verified",
    RETURNED: "Returned",

    PASSED: "Passed",
    FAILED: "Failed",
    CREDITED: "Credited",
    INCOMPLETE: "Incomplete",
    PENDING: "Pending",
};

function resolveVariant(
    props: StatusBadgeProps,
): StatusBadgeVariant {
    if ("status" in props && props.status) {
        return statusVariantMap[props.status];
    }

    return props.variant ?? "neutral";
}

function resolveContent(
    props: StatusBadgeProps,
): ReactNode {
    if (props.children) {
        return props.children;
    }

    if ("status" in props && props.status) {
        return statusLabelMap[props.status];
    }

    return null;
}

export default function StatusBadge(
    props: StatusBadgeProps,
) {
    const {
        dot = false,
        className = "",
    } = props;

    const variant = resolveVariant(props);
    const content = resolveContent(props);

    return (
        <span
            className={[
                "inline-flex min-w-fit items-center justify-center gap-1.5",
                "rounded-full border px-3 py-1 text-xs font-semibold",
                "whitespace-nowrap",
                variantClasses[variant],
                className,
            ].join(" ")}
        >
            {dot ? (
                <span
                    aria-hidden="true"
                    className={[
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        dotClasses[variant],
                    ].join(" ")}
                />
            ) : null}

            {content}
        </span>
    );
}