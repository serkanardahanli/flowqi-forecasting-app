/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Externe pakketten configuratie
  transpilePackages: ['@supabase/ssr'],
  // Middleware en Edge Runtime configuratie
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
}

module.exports = nextConfig 