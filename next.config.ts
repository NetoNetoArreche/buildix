import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

// Force load .env files from the buildix directory, overriding system env vars
const projectDir = path.resolve(__dirname);
loadEnvConfig(projectDir, process.env.NODE_ENV !== "production");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "buildix-user-images.s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "buildix-user-images.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.pexels.com" },
      { protocol: "https", hostname: "cdn.buildixlab.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 horas
  },
};

export default withNextIntl(nextConfig);
