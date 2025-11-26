/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export in production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true, // Required for static export
  },
  reactStrictMode: true,
  // Optional: Configure for subdirectory deployment
  // Uncomment and set basePath if deploying to a subdirectory (e.g., GitHub Pages project site)
  // basePath: '/your-repo-name',
  // assetPrefix: '/your-repo-name',
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
