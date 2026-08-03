import cors from "cors";
import express from "express";
import helmet from "helmet";

import {
    checkDatabaseConnection,
    getDatabaseStatus,
} from "./config/database.js";
import { env } from "./config/env.js";
import { authenticateRequest } from "./middleware/auth.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middleware/errorHandler.js";
import profileRouter from "./routes/profileRoutes.js";

const app = express();

app.disable("x-powered-by");

app.use(
    helmet(),
);

app.use(
    cors({
        origin:
            env.FRONTEND_URL,
        credentials: true,
    }),
);

app.use(
    express.json({
        limit: "1mb",
    }),
);

app.get(
    "/api/health",
    async (
        _request,
        response,
    ) => {
        const databaseAvailable =
            await checkDatabaseConnection();

        response
            .status(
                databaseAvailable
                    ? 200
                    : 503,
            )
            .json({
                success:
                    databaseAvailable,
                data: {
                    service:
                        env.SERVICE_NAME,

                    status:
                        databaseAvailable
                            ? "UP"
                            : "DEGRADED",

                    database:
                        getDatabaseStatus(),

                    timestamp:
                        new Date().toISOString(),
                },
            });
    },
);

app.use(
    "/api/profiles",
    authenticateRequest,
    profileRouter,
);

app.use(
    notFoundHandler,
);

app.use(
    errorHandler,
);

export { app };
export default app;