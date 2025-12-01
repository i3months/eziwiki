/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export in production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true, // Required for static export
  },
  reactStrictMode: true,
  // Optional: Configure for subdirectory deployment
  // Only use basePath for GitHub Pages (not Vercel or other platforms)
  ...(process.env.GITHUB_ACTIONS && {
    basePath: '/eziwiki',
    assetPrefix: '/eziwiki',
  }),
  trailingSlash: true, // Ensures proper routing for static hosting
  
  // Disable source maps in production to prevent viewing original source
  productionBrowserSourceMaps: false,
  
  // Additional optimization for production
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'], // Remove console.log but keep error/warn
      },
    },
  }),
};

module.exports = nextConfig;
