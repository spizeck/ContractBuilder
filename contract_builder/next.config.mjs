import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Tell Webpack how to resolve @/* to src/*
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.alias["@core"] = path.resolve(__dirname, "src/core");
    config.resolve.alias["@shared"] = path.resolve(__dirname, "src/shared");
    return config;
  },

  // Turbopack config (empty since we're using webpack alias)
  turbopack: {},

  async redirects() {
    return [
      // Old /dives routes redirect to new /dive-log routes
      { source: "/dives/:path*", destination: "/dive-log/dives/:path*", permanent: true },
      { source: "/dives", destination: "/dive-log/dives/dashboard", permanent: true },
      // Old /hotels routes redirect to new /contracts/hotels routes
      { source: "/hotels/:path*", destination: "/contracts/hotels/:path*", permanent: true },
      { source: "/hotels", destination: "/contracts/hotels", permanent: true },
      // Old /dive-packages routes redirect to new /contracts/dive-packages routes
      { source: "/dive-packages/:path*", destination: "/contracts/dive-packages/:path*", permanent: true },
      { source: "/dive-packages", destination: "/contracts/dive-packages", permanent: true },
      // Old /hotel-staff routes redirect to new /contracts/hotel-staff routes
      { source: "/hotel-staff/:path*", destination: "/contracts/hotel-staff/:path*", permanent: true },
      { source: "/hotel-staff", destination: "/contracts/hotel-staff", permanent: true },
      // Legacy /app/* routes redirect to clean URLs (for external links/bookmarks)
      { source: "/app/admin/:path*", destination: "/admin/:path*", permanent: true },
      { source: "/app/contracts/:path*", destination: "/contracts/:path*", permanent: true },
      { source: "/app/dive-log/:path*", destination: "/dive-log/:path*", permanent: true },
      { source: "/app/maintenance/:path*", destination: "/maintenance/:path*", permanent: true },
    ];
  },

  // Vercel optimization
  compress: true,
  poweredByHeader: false,
  // Image optimization (updated for Next.js 16)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Build optimizations
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "framer-motion"],
  },
};

export default nextConfig;
