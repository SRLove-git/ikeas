import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  /* config options here */
  output: "standalone",
  trailingSlash: true,
  // Include the CMS content database in the standalone output so the server
  // can read (and the admin panel can edit) it at runtime.
  outputFileTracingIncludes: {
    "/*": ["./src/data/**/*.json"],
  },
  async redirects() {
    return [
      {
        source: "/cn/zh/cat/buzud-rapid-tests",
        destination: "/cn/zh/cat/test-kit",
        permanent: true,
      },
      {
        source: "/cn/zh/cat/buzud-watches",
        destination: "/cn/zh/cat/smart-watch",
        permanent: true,
      },
      {
        source: "/cn/zh/cat/buzud-blood-pressure-monitors",
        destination: "/cn/zh/cat/blood-pressure-monitor",
        permanent: true,
      },
      {
        source: "/cn/zh/cat/buzud-glucose-management",
        destination: "/cn/zh/cat/cgms",
        permanent: true,
      },
      {
        source: "/cn/zh/cat/buzud-health-devices",
        destination: "/cn/zh/cat/thermometer",
        permanent: true,
      },
      {
        source: "/cn/zh/p/buzud-watch-vibrance-star-light-8885020712742",
        destination: "/cn/zh/p/buzud-watch-vibrance-8885020712582",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
