import type { ReactNode } from "react";

import {
    AppSidebar,
    MobileNavigation,
} from "@/components/layout";

interface FacultyLayoutProps {
    children: ReactNode;
}

export default function FacultyLayout({
    children,
}: FacultyLayoutProps) {
    return (
        <>
            <AppSidebar
                role="FACULTY"
                initials="AR"
            />

            {children}

            <MobileNavigation role="FACULTY" />
        </>
    );
}