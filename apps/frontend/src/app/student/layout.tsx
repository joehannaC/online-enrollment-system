import type {
    ReactNode,
} from "react";

import AuthGuard from "@/components/auth/AuthGuard";
import StudentRealtime from "@/components/realtime/StudentRealtime";

import {
    AppSidebar,
    MobileNavigation,
} from "@/components/layout";

interface StudentLayoutProps {
    children: ReactNode;
}

export default function StudentLayout({
    children,
}: StudentLayoutProps) {
    return (
        <AuthGuard allowedRole="STUDENT">
            <>
                <AppSidebar role="STUDENT" />
                
                <StudentRealtime>
                    {children}
                </StudentRealtime>

                <MobileNavigation role="STUDENT" />
            </>
        </AuthGuard>
    );
}