import cors from "cors";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import helmet from "helmet";

import studentRouter from "./routes/studentRoutes.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ??
            "http://localhost:3001",
        credentials: true,
    }),
);

app.use(express.json());

app.get(
    "/api/health",
    (_request, response) => {
        response.status(200).json({
            success: true,
            data: {
                service:
                    "enrollment-service",
                status: "UP",
            },
        });
    },
);

app.use(
    "/api/students",
    studentRouter,
);

app.use(
    (
        error: unknown,
        _request: Request,
        response: Response,
        _next: NextFunction,
    ) => {
        console.error(error);

        response.status(500).json({
            success: false,
            error: {
                code:
                    "INTERNAL_SERVER_ERROR",
                message:
                    "An unexpected server error occurred.",
                service:
                    "enrollment-service",
            },
        });
    },
);

export { app };
export default app;