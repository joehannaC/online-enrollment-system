import type { ReactNode } from "react";

interface FacultyLayoutProps {
    children: ReactNode;
}

export default function FacultyLayout({
    children,
}: FacultyLayoutProps) {
    return (
        <div className="min-h-screen bg-neutral-100">
            {children}
        </div>
    );
}