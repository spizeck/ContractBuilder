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

  // Turbopack alias config (mirrors webpack aliases above)
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "src"),
      "@core": path.resolve(__dirname, "src/core"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },

  async redirects() {
    return [
      // Old /dives routes redirect to new /dive-log routes
      { source: "/dives/:path*", destination: "/dive-log/dives/:path*", permanent: false },
      { source: "/dives", destination: "/dive-log/dives/dashboard", permanent: false },
      // Old /hotels routes redirect to new /contracts/hotels routes
      { source: "/hotels/:path*", destination: "/contracts/hotels/:path*", permanent: false },
      { source: "/hotels", destination: "/contracts/hotels", permanent: false },
      // Old /dive-packages routes redirect to new /contracts/dive-packages routes
      { source: "/dive-packages/:path*", destination: "/contracts/dive-packages/:path*", permanent: false },
      { source: "/dive-packages", destination: "/contracts/dive-packages", permanent: false },
      // Old /hotel-staff routes redirect to new /contracts/hotel-staff routes
      { source: "/hotel-staff/:path*", destination: "/contracts/hotel-staff/:path*", permanent: false },
      { source: "/hotel-staff", destination: "/contracts/hotel-staff", permanent: false },
      // Legacy /app/* routes redirect to clean URLs (for external links/bookmarks)
      { source: "/app/admin/:path*", destination: "/admin/:path*", permanent: false },
      { source: "/app/contracts/:path*", destination: "/contracts/:path*", permanent: false },
      { source: "/app/dive-log/:path*", destination: "/dive-log/:path*", permanent: false },
      { source: "/app/maintenance/:path*", destination: "/maintenance/:path*", permanent: false },
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
