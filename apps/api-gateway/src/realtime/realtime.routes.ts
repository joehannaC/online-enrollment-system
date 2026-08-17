import {
    Router,
} from "express";
import {
    z,
} from "zod";

import {
    authenticateRealtimePublisher,
} from "../middleware/internalRealtimeAuth.js";
import {
    getSocketServer,
} from "./socketServer.js";

const objectIdString =
    z.string()
        .trim()
        .regex(
            /^[a-fA-F0-9]{24}$/,
        );

const realtimeEventSchema =
    z.discriminatedUnion(
        "type",
        [
            z.object({
                type: z.literal(
                    "GRADE_UPDATED",
                ),
                studentIds:
                    z.array(
                        objectIdString,
                    )
                        .min(1),
                facultyId:
                    objectIdString,
                sectionId:
                    objectIdString,
            }),
            z.object({
                type: z.literal(
                    "ENROLLMENT_UPDATED",
                ),
                studentId:
                    objectIdString,
                facultyIds:
                    z.array(
                        objectIdString,
                    ),
                sectionIds:
                    z.array(
                        objectIdString,
                    ),
            }),
        ],
    );

export const realtimeRoutes = Router();

realtimeRoutes.use(authenticateRealtimePublisher,);

realtimeRoutes.post(
    "/",
    (
        request,
        response,
    ) => {
        const parsed =
            realtimeEventSchema.safeParse(
                request.body,
            );

        if (!parsed.success) {
            response
                .status(400)
                .json({
                    success:
                        false,
                    error: {
                        code:
                            "INVALID_REALTIME_EVENT",
                        message:
                            "The realtime event payload is invalid.",
                        details:
                            parsed.error.flatten(),
                    },
                });
            return;
        }

        const io = getSocketServer();
        const event = parsed.data;

        if (event.type === "GRADE_UPDATED") {
            for (const studentId of event.studentIds) {
                io.to(
                    `student:${studentId}`,
                ).emit(
                    "grade:updated",
                    {
                        sectionId:
                            event.sectionId,
                    },
                );
            }

        }

        if (event.type === "ENROLLMENT_UPDATED") {
            for (const facultyId of event.facultyIds
            ) {
                io.to(
                    `faculty:${facultyId}`,
                ).emit(
                    "class-list:updated",
                    {
                        sectionIds:
                            event.sectionIds,
                    },
                );
            }
        }

        response
            .status(204)
            .send();
    },
);
