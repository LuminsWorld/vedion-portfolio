/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Externalize firebase-admin — webpack won't bundle it, Node.js will require it at runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin')
    }
    return config
  },

  // Tell file tracer to include firebase-admin in all API function bundles
  experimental: {
    outputFileTracingIncludes: {
      '/api': ['./node_modules/firebase-admin/**/*'],
      '/api/**': ['./node_modules/firebase-admin/**/*'],
      'pages/api/**': ['./node_modules/firebase-admin/**/*'],
    },
  },
}

module.exports = nextConfig
