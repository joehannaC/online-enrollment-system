import type { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    paddedBottom?: boolean;
}

export default function PageContainer({
    children,
    className = "",
    contentClassName = "",
    paddedBottom = true,
}: PageContainerProps) {
    return (
        <div
            className={[
                "min-h-screen bg-neutral-100",
                "lg:pl-[88px]",
                paddedBottom
                    ? "pb-24 lg:pb-0"
                    : "",
                className,
            ].join(" ")}
        >
            <main
                className={[
                    "mx-auto w-full max-w-[1600px]",
                    "px-4 py-4",
                    "sm:px-6 sm:py-6",
                    "lg:px-8 lg:py-8",
                    contentClassName,
                ].join(" ")}
            >
                {children}
            </main>
        </div>
    );
}