/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent firebase-admin from being bundled by webpack
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        'firebase-admin',
        'firebase-admin/app',
        'firebase-admin/auth',
        'firebase-admin/firestore',
        'firebase-admin/storage',
      ]
    }
    return config
  },
}
module.exports = nextConfig
