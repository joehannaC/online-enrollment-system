import {
    Inbox,
    type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    compact?: boolean;
    className?: string;
}

export default function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
    compact = false,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center rounded-2xl",
                "border border-dashed border-neutral-300 bg-white text-center",
                compact
                    ? "px-5 py-8"
                    : "min-h-72 px-6 py-12",
                className,
            ].join(" ")}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#35822E]/10 text-[#35822E]">
                <Icon
                    aria-hidden="true"
                    className="h-7 w-7"
                />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-neutral-900">
                {title}
            </h2>

            {description ? (
                <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
                    {description}
                </p>
            ) : null}

            {action ? (
                <div className="mt-5">
                    {action}
                </div>
            ) : null}
        </div>
    );
}