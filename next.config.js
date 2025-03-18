/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google profile pictures
      'googleusercontent.com'       // Alternative Google domain
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 