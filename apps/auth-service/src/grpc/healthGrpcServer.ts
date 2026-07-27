import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";

import { env } from "../config/env.js";
import {
  getDatabaseStatus,
  isDatabaseConnected,
} from "../config/database.js";

interface HealthRequest {
  service?: string;
}

interface HealthResponse {
  status: string;
  service: string;
  transport: string;
  databaseStatus: string;
  timestamp: string;
}

interface HealthPackage {
  enrollment: {
    health: {
      v1: {
        HealthService: {
          service: grpc.ServiceDefinition;
        };
      };
    };
  };
}

const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/health.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor =
  grpc.loadPackageDefinition(
    packageDefinition,
  ) as unknown as HealthPackage;

const healthService =
  protoDescriptor.enrollment.health.v1.HealthService;

function checkHealth(
  call: grpc.ServerUnaryCall<HealthRequest, HealthResponse>,
  callback: grpc.sendUnaryData<HealthResponse>,
): void {
  const requestedService = call.request.service?.trim();

  if (
    requestedService &&
    requestedService !== env.SERVICE_NAME
  ) {
    callback({
      code: grpc.status.NOT_FOUND,
      message: `Unknown service: ${requestedService}`,
    });

    return;
  }

  const databaseConnected = isDatabaseConnected();

  callback(null, {
    status: databaseConnected ? "SERVING" : "NOT_SERVING",
    service: env.SERVICE_NAME,
    transport: "gRPC",
    databaseStatus: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  });
}

export async function startGrpcServer(): Promise<grpc.Server> {
  const server = new grpc.Server();

  server.addService(healthService.service, {
    check: checkHealth,
  });

  const address = `${env.GRPC_HOST}:${env.GRPC_PORT}`;

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          reject(error);
          return;
        }

        console.log(
          `[${env.SERVICE_NAME}] gRPC listening on ${env.GRPC_HOST}:${boundPort}`,
        );

        resolve();
      },
    );
  });

  return server;
}

export async function stopGrpcServer(
  server: grpc.Server,
): Promise<void> {
  await new Promise<void>((resolve) => {
    server.tryShutdown((error) => {
      if (error) {
        console.error(
          `[${env.SERVICE_NAME}] Graceful gRPC shutdown failed`,
          error,
        );

        server.forceShutdown();
      }

      resolve();
    });
  });
}