// next.config.ts
import type { NextConfig } from "next";

const withNextIntl = require("next-intl/plugin")("./i18n/request.ts");

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(withPWA(nextConfig));
