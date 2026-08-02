import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const workspaceRoot = path.resolve(currentDirectory, "../..");

const nextConfig: NextConfig = {
    devIndicators: false,
    turbopack: { root: workspaceRoot },
};

export default nextConfig;
