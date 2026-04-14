/** @type {import('next').NextConfig} */
const nextConfig = {
  // Needed for Capacitor: produces a static `out/` directory
  output: 'export',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
