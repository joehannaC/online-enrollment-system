import type { ReactNode } from "react";

interface DashboardHeaderProps {
    title: string;
    description?: string;
    badge?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export default function DashboardHeader({
    title,
    description,
    badge,
    actions,
    className = "",
}: DashboardHeaderProps) {
    return (
        <header
            className={[
                "rounded-2xl bg-[#35822E]",
                "px-5 py-6 text-white shadow-sm",
                "sm:px-7 sm:py-7",
                "lg:px-8 lg:py-8",
                className,
            ].join(" ")}
        >
            <div
                className="
                    flex flex-col gap-4
                    sm:flex-row sm:items-start
                    sm:justify-between
                "
            >
                <div className="min-w-0">
                    <h1
                        className="
                            font-serif text-2xl
                            font-semibold leading-tight
                            sm:text-3xl lg:text-4xl
                        "
                    >
                        {title}
                    </h1>

                    {description ? (
                        <p
                            className="
                                mt-2 max-w-3xl
                                text-sm leading-6
                                text-white/80
                            "
                        >
                            {description}
                        </p>
                    ) : null}
                </div>

                {badge || actions ? (
                    <div
                        className="
                            flex shrink-0 flex-wrap
                            items-center gap-3
                        "
                    >
                        {badge}

                        {actions}
                    </div>
                ) : null}
            </div>
        </header>
    );
}