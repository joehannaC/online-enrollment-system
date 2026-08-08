"use client";

import {
    Fragment,
    type ReactNode,
    useEffect,
    useState,
} from "react";

import {
    connectRealtimeSocket,
} from "@/lib/realtime/socket";

interface StudentRealtimeProps {
    children: ReactNode;
}

export default function StudentRealtime({
    children,
}: StudentRealtimeProps) {
    const [
        refreshVersion,
        setRefreshVersion,
    ] = useState(0);

    useEffect(() => {
        const socket =
            connectRealtimeSocket();

        const refreshStudentData =
            () => {
                setRefreshVersion(
                    (current) =>
                        current + 1,
                );
            };

        socket.on(
            "grade:updated",
            refreshStudentData,
        );

        return () => {
            socket.off(
                "grade:updated",
                refreshStudentData,
            );
            socket.disconnect();
        };
    }, []);

    return (
        <Fragment
            key={refreshVersion}
        >
            {children}
        </Fragment>
    );
}
