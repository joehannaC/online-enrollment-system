import {
    env,
} from "../config/env.js";

interface EnrollmentUpdatedRealtimeEvent {
    type: "ENROLLMENT_UPDATED";
    studentId: string;
    facultyIds: string[];
    sectionIds: string[];
}

export async function publishEnrollmentUpdated(
    event: Omit<
        EnrollmentUpdatedRealtimeEvent,
        "type"
    >,
): Promise<void> {
    try {
        const response =
            await fetch(
                `${env.API_GATEWAY_URL}/internal/realtime`,
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "X-Internal-Secret":
                            env.REALTIME_INTERNAL_SECRET,
                    },
                    body:
                        JSON.stringify(
                            {
                                type:
                                    "ENROLLMENT_UPDATED",
                                ...event,
                            } satisfies EnrollmentUpdatedRealtimeEvent,
                        ),
                    signal:
                        AbortSignal.timeout(
                            5_000,
                        ),
                },
            );

        if (!response.ok) {
            console.error(
                "[enrollment-service] Realtime notification failed",
                {
                    status:
                        response.status,
                },
            );
        }
    } catch (error) {
        console.error(
            "[enrollment-service] Realtime gateway unavailable",
            error,
        );
    }
}
