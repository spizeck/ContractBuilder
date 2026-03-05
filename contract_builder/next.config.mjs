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
      { source: "/admin/:path*", destination: "/app/admin/:path*", permanent: true },
      { source: "/contracts/:path*", destination: "/app/contracts/:path*", permanent: true },
      { source: "/contracts", destination: "/app/contracts", permanent: true },
      { source: "/hotels/:path*", destination: "/app/contracts/hotels/:path*", permanent: true },
      { source: "/hotels", destination: "/app/contracts/hotels", permanent: true },
      { source: "/dive-packages/:path*", destination: "/app/contracts/dive-packages/:path*", permanent: true },
      { source: "/dive-packages", destination: "/app/contracts/dive-packages", permanent: true },
      { source: "/dives/:path*", destination: "/app/dive-log/:path*", permanent: true },
      { source: "/dives", destination: "/app/dive-log", permanent: true },
      { source: "/maintenance/:path*", destination: "/app/maintenance/:path*", permanent: true },
      { source: "/maintenance", destination: "/app/maintenance", permanent: true },
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
