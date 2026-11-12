import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite carregar ficheiros de backup grandes no restauro
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
