import type { NextConfig } from "next";

const origins_dev = [
  '192.168.6.145',
  '100.105.177.100',
  '192.168.1.187',
  "192.168.30.40"
]

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: origins_dev
};

export default nextConfig;
