/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Enterprise optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
}

module.exports = nextConfig