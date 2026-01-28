import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow cross-origin requests from localhost and 127.0.0.1 in development
  // This fixes the warning: "Blocked cross-origin request from 127.0.0.1 to /_next/* resource"
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    '127.0.0.1',
    '127.0.0.1:3000',
    'localhost',
    'localhost:3000',
  ],
};

export default nextConfig;
