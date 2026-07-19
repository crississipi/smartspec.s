import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopee
      { hostname: "*.shopee.ph" },
      { hostname: "down-ph.img.susercontent.com" },
      { hostname: "cf.shopee.ph" },
      // Lazada
      { hostname: "*.lazcdn.com" },
      { hostname: "img.lazcdn.com" },
      // DataBlitz
      { hostname: "ecommerce.datablitz.com.ph" },
      { hostname: "*.datablitz.com.ph" },
      // PCPartPicker
      { hostname: "media.pangoly.com" },
      { hostname: "pangoly.com" },
      // Amazon
      { hostname: "*.media-amazon.com" },
      { hostname: "m.media-amazon.com" },
      // Newegg
      { hostname: "*.neweggimages.com" },
      // Generic image CDNs
      { hostname: "*.cloudflare.com" },
      { hostname: "*.fastly.net" },
      // Brand official
      { hostname: "corsair.com" },
      { hostname: "assets.corsair.com" },
      { hostname: "nzxt.com" },
      { hostname: "lian-li.com" },
      { hostname: "www.lian-li.com" },
      { hostname: "phanteks.com" },
      { hostname: "www.phanteks.com" },
      { hostname: "www.thermaltake.com" },
      { hostname: "thermaltake.com" },
      { hostname: "www.bequiet.com" },
      { hostname: "bequiet.com" },
      { hostname: "www.fractal-design.com" },
      { hostname: "fractal-design.com" },
      { hostname: "bermorzone.com.ph" },
      { hostname: "pcx.com.ph" },
      { hostname: "netcodex.ph" },
      { hostname: "pcmena.com" },
      { hostname: "www.amazon.com" },
      { hostname: "www.pcmag.com" },
      { hostname: "pcmag.com" },
      { hostname: "i.pcmag.com" },
      { hostname: "ssupd.co" },
      // General
      { hostname: "*" },
    ],
  },
};

export default nextConfig;
