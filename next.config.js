/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily disable ESLint during builds to focus on TypeScript errors
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'pbs.twimg.com',
      'scontent.cdninstagram.com',
      'graph.facebook.com',
      'media.licdn.com',
      'p16-sign-va.tiktokcdn.com'
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
}

module.exports = nextConfig