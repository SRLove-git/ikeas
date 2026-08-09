import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  trailingSlash: true,
  // Include the CMS content database in the standalone output so the server
  // can read (and the admin panel can edit) it at runtime.
  outputFileTracingIncludes: {
    "/*": ["./src/data/**/*.json"],
  },
};

export default nextConfig;
