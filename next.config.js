/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Externalize firebase-admin from webpack so it's not bundled (it breaks when bundled)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin')
    }
    return config
  },

  // Tell Vercel's file tracer to include firebase-admin in the deployment bundle
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': ['./node_modules/firebase-admin/**/*'],
    },
  },
}

module.exports = nextConfig
