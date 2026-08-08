"use client";

import {
    io,
    type Socket,
} from "socket.io-client";

import {
    getAccessToken,
} from "@/lib/auth/tokenStorage";

const realtimeGatewayUrl =
    process.env
        .NEXT_PUBLIC_API_GATEWAY_URL
        ?.trim() ??
    "";

let socket:
    | Socket
    | undefined;

export function getRealtimeSocket(): Socket {
    if (!socket) {
        socket = io(
            realtimeGatewayUrl,
            {
                autoConnect:
                    false,
                withCredentials:
                    true,
                transports: [
                    "websocket",
                    "polling",
                ],
            },
        );
    }

    return socket;
}

export function connectRealtimeSocket(): Socket {
    const realtimeSocket =
        getRealtimeSocket();
    const accessToken =
        getAccessToken();

    if (!accessToken) {
        return realtimeSocket;
    }

    realtimeSocket.auth = {
        token:
            accessToken,
    };

    if (
        !realtimeSocket.connected
    ) {
        realtimeSocket.connect();
    }

    return realtimeSocket;
}
