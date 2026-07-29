import type { ReactNode } from "react";

interface ProfileHeaderProps {
    name: string;
    subtitle?: string;
    actions?: ReactNode;
    className?: string;
}

export default function ProfileHeader({
    name,
    subtitle,
    actions,
    className = "",
}: ProfileHeaderProps) {
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
                    sm:flex-row sm:items-center
                    sm:justify-between
                "
            >
                <div>
                    <p
                        className="
                            text-xs font-medium
                            uppercase tracking-[0.2em]
                            text-white/70
                        "
                    >
                        Profile
                    </p>

                    <h1
                        className="
                            mt-2 font-serif
                            text-2xl font-semibold
                            sm:text-3xl lg:text-4xl
                        "
                    >
                        Welcome, {name}!
                    </h1>

                    {subtitle ? (
                        <p
                            className="
                                mt-2 text-sm
                                text-white/80
                            "
                        >
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {actions ? (
                    <div className="shrink-0">
                        {actions}
                    </div>
                ) : null}
            </div>
        </header>
    );
}