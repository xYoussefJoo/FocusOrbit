import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Next.js internal type mapping issue for specific beta configs
  allowedDevOrigins: ['192.168.74.1'],
};

export default nextConfig;
