import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/ghcp-crazy-challenge",
  images: { unoptimized: true },
};

export default nextConfig;
