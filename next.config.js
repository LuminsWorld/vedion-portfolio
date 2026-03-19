/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  serverExternalPackages: ['firebase-admin'],
}
module.exports = nextConfig
