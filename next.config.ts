import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "https://tophexity-func.azurewebsites.net/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
