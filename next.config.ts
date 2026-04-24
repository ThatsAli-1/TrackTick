import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
