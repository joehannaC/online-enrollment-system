import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });

    console.log(
      `[${env.SERVICE_NAME}] MongoDB connection established`,
    );
  } catch (error) {
    console.error(
      `[${env.SERVICE_NAME}] MongoDB connection failed`,
      error,
    );

    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();

  console.log(
    `[${env.SERVICE_NAME}] MongoDB connection closed`,
  );
}

export function getDatabaseStatus(): string {
  switch (mongoose.connection.readyState) {
    case 0:
      return "DISCONNECTED";
    case 1:
      return "CONNECTED";
    case 2:
      return "CONNECTING";
    case 3:
      return "DISCONNECTING";
    default:
      return "UNKNOWN";
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}