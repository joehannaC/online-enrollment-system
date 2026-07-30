import type { ReactNode } from "react";

import {
    AppSidebar,
    MobileNavigation,
} from "../../components/layout/";

interface StudentLayoutProps {
    children: ReactNode;
}

export default function StudentLayout({
    children,
}: StudentLayoutProps) {
    return (
        <>
            <AppSidebar role="STUDENT" />

            {children}

            <MobileNavigation role="STUDENT" />
        </>
    );
}