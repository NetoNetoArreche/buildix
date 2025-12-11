import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

// Force load .env files from the buildix directory, overriding system env vars
const projectDir = path.resolve(__dirname);
loadEnvConfig(projectDir, process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  /* config options here */
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Limite para requests processados pelo proxy (Next.js 16)
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
