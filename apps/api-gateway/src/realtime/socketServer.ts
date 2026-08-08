import type {
    Server as HttpServer,
} from "node:http";

import jwt from "jsonwebtoken";
import {
    Server,
} from "socket.io";

import {
    env,
} from "../config/env.js";
import type {
    RealtimeJwtPayload,
} from "./realtime.types.js";

let socketServer:
    | Server
    | undefined;

function getBearerToken(
    value: unknown,
): string | undefined {
    if (
        typeof value !==
        "string"
    ) {
        return undefined;
    }

    const trimmedValue =
        value.trim();

    if (!trimmedValue) {
        return undefined;
    }

    return trimmedValue;
}

function verifyRealtimeToken(
    token: string,
): RealtimeJwtPayload {
    const decoded =
        jwt.verify(
            token,
            env.JWT_SECRET,
            {
                algorithms: [
                    "HS256",
                ],
                issuer:
                    env.JWT_ISSUER,
                audience:
                    env.JWT_AUDIENCE,
            },
        );

    if (
        typeof decoded !==
        "object" ||
        decoded === null
    ) {
        throw new Error(
            "Invalid token payload.",
        );
    }

    const payload =
        decoded as unknown as RealtimeJwtPayload;

    if (
        !payload.userId ||
        !payload.role
    ) {
        throw new Error(
            "Invalid token payload.",
        );
    }

    if (
        payload.role ===
            "STUDENT" &&
        !payload.studentId
    ) {
        throw new Error(
            "Student token does not include a student ID.",
        );
    }

    if (
        payload.role ===
            "FACULTY" &&
        !payload.facultyId
    ) {
        throw new Error(
            "Faculty token does not include a faculty ID.",
        );
    }

    return payload;
}

export function initializeSocketServer(
    httpServer: HttpServer,
): Server {
    const io = new Server(
        httpServer,
        {
            cors: {
                origin(
                    origin,
                    callback,
                ) {
                    if (!origin) {
                        callback(
                            null,
                            true,
                        );
                        return;
                    }

                    if (
                        env.FRONTEND_ORIGINS.includes(
                            origin,
                        )
                    ) {
                        callback(
                            null,
                            true,
                        );
                        return;
                    }

                    callback(
                        new Error(
                            `CORS blocked origin: ${origin}`,
                        ),
                    );
                },
                credentials:
                    true,
            },
        },
    );

    io.use(
        (
            socket,
            next,
        ) => {
            try {
                const token =
                    getBearerToken(
                        socket
                            .handshake
                            .auth
                            ?.token,
                    );

                if (!token) {
                    next(
                        new Error(
                            "Unauthorized realtime connection.",
                        ),
                    );
                    return;
                }

                const payload =
                    verifyRealtimeToken(
                        token,
                    );

                socket.data.user =
                    payload;

                next();
            } catch {
                next(
                    new Error(
                        "Unauthorized realtime connection.",
                    ),
                );
            }
        },
    );

    io.on(
        "connection",
        (socket) => {
            const user =
                socket.data
                    .user as RealtimeJwtPayload;

            socket.join(
                `user:${user.userId}`,
            );

            if (
                user.role ===
                    "STUDENT" &&
                user.studentId
            ) {
                socket.join(
                    `student:${user.studentId}`,
                );
            }

            if (
                user.role ===
                    "FACULTY" &&
                user.facultyId
            ) {
                socket.join(
                    `faculty:${user.facultyId}`,
                );
            }

            console.log(
                `[${env.SERVICE_NAME}] Realtime client connected`,
                {
                    socketId:
                        socket.id,
                    role:
                        user.role,
                    userId:
                        user.userId,
                },
            );

            socket.on(
                "disconnect",
                (reason) => {
                    console.log(
                        `[${env.SERVICE_NAME}] Realtime client disconnected`,
                        {
                            socketId:
                                socket.id,
                            reason,
                        },
                    );
                },
            );
        },
    );

    socketServer = io;

    return io;
}

export function getSocketServer(): Server {
    if (!socketServer) {
        throw new Error(
            "Realtime socket server has not been initialized.",
        );
    }

    return socketServer;
}
