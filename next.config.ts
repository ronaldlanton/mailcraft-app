import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google profile pictures
      'googleusercontent.com'       // Alternative Google domain
    ],
  }
};

export default nextConfig;
