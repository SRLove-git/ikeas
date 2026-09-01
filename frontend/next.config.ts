import type { NextConfig } from "next"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

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
        source: "/zh/cat/buzud-rapid-tests",
        destination: "/zh/cat/test-kit",
        permanent: true,
      },
      {
        source: "/zh/cat/buzud-watches",
        destination: "/zh/cat/smart-watch",
        permanent: true,
      },
      {
        source: "/zh/cat/buzud-blood-pressure-monitors",
        destination: "/zh/cat/blood-pressure-monitor",
        permanent: true,
      },
      {
        source: "/zh/cat/buzud-glucose-management",
        destination: "/zh/cat/cgms",
        permanent: true,
      },
      {
        source: "/zh/cat/buzud-health-devices",
        destination: "/zh/cat/thermometer",
        permanent: true,
      },
      {
        source: "/zh/p/buzud-watch-vibrance-star-light-8885020712742",
        destination: "/zh/p/buzud-watch-vibrance-8885020712582",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ]
  },
}

export default nextConfig
