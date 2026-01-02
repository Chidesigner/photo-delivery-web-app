import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xwfyhbiwbfihaluklnez.supabase.co",
      },
    ],
  },
}

export default nextConfig
