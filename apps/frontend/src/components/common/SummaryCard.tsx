import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SummaryCardProps {
    label: string;
    value: ReactNode;
    description?: string;
    icon?: LucideIcon;
    accent?: "primary" | "warning" | "danger" | "info";
    className?: string;
}

const accentClasses = {
    primary: {
        icon: "bg-[#35822E]/10 text-[#35822E]",
        value: "text-[#35822E]",
    },

    warning: {
        icon: "bg-amber-100 text-amber-700",
        value: "text-amber-700",
    },

    danger: {
        icon: "bg-red-100 text-red-700",
        value: "text-red-700",
    },

    info: {
        icon: "bg-blue-100 text-blue-700",
        value: "text-blue-700",
    },
};

export default function SummaryCard({
    label,
    value,
    description,
    icon: Icon,
    accent = "primary",
    className = "",
}: SummaryCardProps) {
    const accentStyle =
        accentClasses[accent];

    return (
        <article
            className={[
                "rounded-xl border border-neutral-200 bg-white p-4",
                "shadow-sm transition-shadow hover:shadow-md",
                className,
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        {label}
                    </p>

                    <p
                        className={[
                            "mt-2 text-2xl font-bold",
                            accentStyle.value,
                        ].join(" ")}
                    >
                        {value}
                    </p>

                    {description ? (
                        <p className="mt-1 text-xs text-neutral-500">
                            {description}
                        </p>
                    ) : null}
                </div>

                {Icon ? (
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            accentStyle.icon,
                        ].join(" ")}
                    >
                        <Icon
                            aria-hidden="true"
                            className="h-5 w-5"
                        />
                    </div>
                ) : null}
            </div>
        </article>
    );
}