import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Shown in Settings; comes from package.json, so each release bump updates it.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
};

export default nextConfig;
