import type {
    ReactNode,
} from "react";

import AuthGuard from "@/components/auth/AuthGuard";

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
        <AuthGuard allowedRole="FACULTY">
            <>
                <AppSidebar role="FACULTY" />

                {children}

                <MobileNavigation role="FACULTY" />
            </>
        </AuthGuard>
    );
}