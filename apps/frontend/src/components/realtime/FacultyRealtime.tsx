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

interface FacultyRealtimeProps {
    children: ReactNode;
}

export default function FacultyRealtime({
    children,
}: FacultyRealtimeProps) {
    const [
        refreshVersion,
        setRefreshVersion,
    ] = useState(0);

    useEffect(() => {
        const socket =
            connectRealtimeSocket();

        const refreshFacultyData =
            () => {
                setRefreshVersion(
                    (current) =>
                        current + 1,
                );
            };

        socket.on(
            "class-list:updated",
            refreshFacultyData,
        );

        return () => {
            socket.off(
                "class-list:updated",
                refreshFacultyData,
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
