interface LoadingSkeletonProps {
    className?: string;
    rounded?: "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
    sm: "rounded",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
};

export default function LoadingSkeleton({
    className = "",
    rounded = "md",
}: LoadingSkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={[
                "animate-pulse bg-neutral-200",
                roundedClasses[rounded],
                className,
            ].join(" ")}
        />
    );
}

export function TableLoadingSkeleton({
    rows = 5,
    columns = 4,
}: {
    rows?: number;
    columns?: number;
}) {
    return (
        <div
            aria-label="Loading table"
            role="status"
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
        >
            <div
                className="grid gap-4 bg-[#35822E]/10 px-5 py-4"
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({
                    length: columns,
                }).map((_, index) => (
                    <LoadingSkeleton
                        key={index}
                        className="h-4"
                    />
                ))}
            </div>

            <div className="divide-y divide-neutral-100">
                {Array.from({
                    length: rows,
                }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4 px-5 py-4"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        }}
                    >
                        {Array.from({
                            length: columns,
                        }).map(
                            (
                                _,
                                columnIndex,
                            ) => (
                                <LoadingSkeleton
                                    key={
                                        columnIndex
                                    }
                                    className="h-4"
                                />
                            ),
                        )}
                    </div>
                ))}
            </div>

            <span className="sr-only">
                Loading data
            </span>
        </div>
    );
}

export function CardLoadingSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading card"
            className="rounded-xl border border-neutral-200 bg-white p-5"
        >
            <LoadingSkeleton className="h-4 w-28" />

            <LoadingSkeleton className="mt-3 h-8 w-20" />

            <LoadingSkeleton className="mt-3 h-3 w-36" />

            <span className="sr-only">
                Loading content
            </span>
        </div>
    );
}