import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Tell Webpack how to resolve @/* to src/*
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },

  // Vercel optimization
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    domains: ["firebasestorage.googleapis.com"],
    formats: ["image/webp", "image/avif"],
  },
  // Build optimizations
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "framer-motion"],
  },
};

export default nextConfig;
