/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TensorFlow.js / WASM 需在 client 載入
  transpilePackages: ['@tensorflow/tfjs'],
  webpack: (config, { isServer }) => {
    if (isServer) return config;
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

module.exports = nextConfig;
