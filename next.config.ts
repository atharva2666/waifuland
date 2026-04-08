import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.waifu.pics',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nekos.best',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.nekos.life',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.donmai.us',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'danbooru.donmai.us',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.gelbooru.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'files.yande.re',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'konachan.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
