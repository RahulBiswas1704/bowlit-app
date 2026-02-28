/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.sidechef.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com', // Added for the default avatar/logos
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org', // Added for Wikipedia images
      },
      {
        protocol: 'https',
        hostname: '**', // Catch-all for any other external images
      }
    ],
  },
};

export default nextConfig;
