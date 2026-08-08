import {
    env,
} from "../config/env.js";

interface GradeUpdatedRealtimeEvent {
    type: "GRADE_UPDATED";
    studentIds: string[];
    facultyId: string;
    sectionId: string;
}

export async function publishGradeUpdated(
    event: Omit<
        GradeUpdatedRealtimeEvent,
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
                                    "GRADE_UPDATED",
                                ...event,
                            } satisfies GradeUpdatedRealtimeEvent,
                        ),
                    signal:
                        AbortSignal.timeout(
                            5_000,
                        ),
                },
            );

        if (!response.ok) {
            console.error(
                "[grade-service] Realtime notification failed",
                {
                    status:
                        response.status,
                },
            );
        }
    } catch (error) {
        console.error(
            "[grade-service] Realtime gateway unavailable",
            error,
        );
    }
}
