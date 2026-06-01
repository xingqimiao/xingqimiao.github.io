import type { NextConfig } from "next";
import globalConfig from "./src/data/global_config.json";

const nextConfig: NextConfig = {
  output: "export",
  basePath: globalConfig.base_path || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
