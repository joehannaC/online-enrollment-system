import type { ReactNode } from "react";

interface StudentLayoutProps {
    children: ReactNode;
}

export default function StudentLayout({
    children,
}: StudentLayoutProps) {
    return (
        <div className="min-h-screen bg-neutral-100">
            {children}
        </div>
    );
}