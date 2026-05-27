import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The dev server (and the ported artifact files marked `@ts-nocheck`) rely on
  // SWC, not tsc. `next build` otherwise runs a full type-check + ESLint pass
  // that the intentionally-loose ported code fails on. Correctness is gated by
  // the dedicated `pnpm typecheck` / `pnpm lint` scripts instead, so we don't
  // let those block the production build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default withPayload(nextConfig)
