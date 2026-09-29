import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets another device on the local network (this machine's LAN address) open the dev server.
  allowedDevOrigins: ['192.168.74.1'],
};

export default nextConfig;
