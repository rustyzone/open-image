/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  headers: async () => {
    return [
      {
        // cache images form /api/image for 3 hours
        source: '/api/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=10800, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
