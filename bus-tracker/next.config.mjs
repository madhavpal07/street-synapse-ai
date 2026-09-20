/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: process.env.DEV_TUNNEL_HOST ? [process.env.DEV_TUNNEL_HOST] : [],
  reactStrictMode: true,
  // This is a regular Next.js app with a custom Express/Socket.IO server.
  // Do not enable output: 'standalone' or output: 'export' here.
};
export default nextConfig;
