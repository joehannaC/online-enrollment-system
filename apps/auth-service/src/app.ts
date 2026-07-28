import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import {
  getDatabaseStatus,
  isDatabaseConnected,
} from "./config/database.js";
import { authRoutes } from "./routes/authRoutes.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  const databaseConnected = isDatabaseConnected();

  response.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "UP" : "DEGRADED",
    service: env.SERVICE_NAME,
    transport: "HTTP",
    databaseStatus: getDatabaseStatus(),
    host: env.HTTP_HOST,
    port: env.HTTP_PORT,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);

app.use(
  (
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    response.status(404).json({
      error: "Route not found",
      service: env.SERVICE_NAME,
    });
  },
);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    console.error(`[${env.SERVICE_NAME}]`, error);

    response.status(500).json({
      error: "Internal server error",
      service: env.SERVICE_NAME,
    });
  },
);