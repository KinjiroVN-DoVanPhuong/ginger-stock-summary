/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable static export
    output: 'export',

    // Required for static export
    images: {
        unoptimized: true,
    },

    // Disable trailing slash
    trailingSlash: false,

    // Ignore TypeScript errors during build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Environment variables that should be available at build time
    env: {
        // Add any build-time env vars here
    }
}

module.exports = nextConfig
