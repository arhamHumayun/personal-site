import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/puzzle", destination: "/play/ice-slide", permanent: true }];
  },
};

export default nextConfig;
