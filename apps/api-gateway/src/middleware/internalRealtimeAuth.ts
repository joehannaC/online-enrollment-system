import {
    timingSafeEqual,
} from "node:crypto";

import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    env,
} from "../config/env.js";

function secretsMatch(
    received: string,
    expected: string,
): boolean {
    const receivedBuffer =
        Buffer.from(received);
    const expectedBuffer =
        Buffer.from(expected);

    if (
        receivedBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
    );
}

export function authenticateRealtimePublisher(
    request: Request,
    response: Response,
    next: NextFunction,
): void {
    const receivedSecret =
        request.header(
            "x-internal-secret",
        );

    if (
        !receivedSecret ||
        !secretsMatch(
            receivedSecret,
            env.REALTIME_INTERNAL_SECRET,
        )
    ) {
        response
            .status(403)
            .json({
                success: false,
                error: {
                    code:
                        "REALTIME_PUBLISH_FORBIDDEN",
                    message:
                        "The realtime event publisher is not authorized.",
                    service:
                        env.SERVICE_NAME,
                },
            });
        return;
    }

    next();
}
