import { glob } from "glob";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@adobe/react-spectrum",
    "@react-spectrum/*",
    "@spectrum-icons/*",
  ].flatMap((spec) => glob.sync(`${spec}`, { cwd: "node_modules/" })),
};

export default nextConfig;
