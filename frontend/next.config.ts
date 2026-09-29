import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    return apiUrl
      ? [{ source: "/api/backend/:path*", destination: `${apiUrl}/:path*` }]
      : [];
  },
};

export default nextConfig;
