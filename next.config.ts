import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone", // Azure App Service — self-contained Node.js server
  // Mongoose is server-only; keep it out of the client/edge bundle.
  serverExternalPackages: ["mongoose", "@auth/mongodb-adapter", "mongodb"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Allow optimized images from our storage/CDN host (configured per-env in Phase 12).
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "images.unsplash.com" }, // placeholder/demo imagery
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
