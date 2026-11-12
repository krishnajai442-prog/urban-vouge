import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
     images: {
      unoptimized: true,
      remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.flixcart.com" },
      { protocol: "https", hostname: "static-assets-web.flixcart.com" },
      { protocol: "https", hostname: "*.media-amazon.com" },
      { protocol: "https", hostname: "*.ssl-images-amazon.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.myntassets.com" },
      { protocol: "https", hostname: "assets.ajio.com" },
      { protocol: "https", hostname: "adn-static1.nykaa.com" },
      { protocol: "https", hostname: "myraymond.com" },
      { protocol: "https", hostname: "levi.in" },
      { protocol: "https", hostname: "img.tatacliq.com" },
      { protocol: "https", hostname: "wrogn.com" },
      { protocol: "https", hostname: "thehouseofrare.com" },
      { protocol: "https", hostname: "blackberrys.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "www.casio.com" },
      { protocol: "https", hostname: "img.fossil.in" },
      { protocol: "https", hostname: "himalayaoptical.com" },
      { protocol: "https", hostname: "assets-jiocdn.ajio.com" },
      { protocol: "https", hostname: "www.jockey.in" },
      { protocol: "https", hostname: "assets.adidas.com" },
      { protocol: "https", hostname: "image.uniqlo.com" },
      { protocol: "https", hostname: "images.puma.com" },
      { protocol: "https", hostname: "www.muftijeans.in" },
      { protocol: "https", hostname: "cdn17.nnnow.com" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  allowedDevOrigins: ["10.24.128.75", "10.88.235.75", "172.17.144.1", "10.199.150.75", "localhost"],
};

export default nextConfig;


