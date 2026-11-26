import path from 'path';
import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next.js App Router hydration scripts and layout.tsx fdprocessedid observer;
  // strict nonce-based CSP would disable static prerendering across all 25 static routes.
  // https://pass.hostnsoft.com is required by the MSG91 OTP widget (otp-provider.js).
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://verify.msg91.com https://pass.hostnsoft.com",
  // 'unsafe-inline' is required by Tailwind CSS runtime styles, SweetAlert2, and Recharts.
  // https://fonts.googleapis.com is injected by the MSG91 OTP widget Shadow DOM.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://placehold.co",
  // https://fonts.gstatic.com serves font files referenced by MSG91's Google Fonts stylesheet.
  "font-src 'self' data: https://fonts.gstatic.com",
  // https://passbknd.hostnsoft.com is used by the MSG91 OTP widget backend API.
  "connect-src 'self' https://yoxfashion.com https://admin.yoxfashion.com https://api.yoxfashion.com wss://yoxfashion.com wss://api.yoxfashion.com https://api.razorpay.com https://lumberjack.razorpay.com https://verify.msg91.com https://control.msg91.com https://passbknd.hostnsoft.com https://res.cloudinary.com",
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://verify.msg91.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    dangerouslyAllowSVG: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Enforced Content Security Policy (migrated from Report-Only after 100% verified compatibility)
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
