import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pkmn-tools",
  images: {
    unoptimized: true
  },
  reactCompiler: true,
  transpilePackages: []
};

export default nextConfig;
